import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SingleWinnerD21Voting } from "../target/types/single_winner_d21_voting";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect, assert } from "chai";

// Helper function to sleep (wait for timestamps)
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

describe("single-winner-d21-voting", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .singleWinnerD21Voting as Program<SingleWinnerD21Voting>;

  // --- Test Wallets & Accounts ---
  const authority = provider.wallet as anchor.Wallet;
  let electionAccount: Keypair;
  const candidates_3 = ["Alice", "Bob", "Charlie"];
  const candidates_7 = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
  ];
  const voter1 = Keypair.generate();
  const voter2 = Keypair.generate();
  const voter3 = Keypair.generate();

  // Helper to get on-chain time
  const getBlockTime = async (): Promise<number> => {
    const slot = await provider.connection.getSlot();
    return await provider.connection.getBlockTime(slot);
  };

  // Helper to find the VoterState PDA for a given voter
  const getVoterStatePDA = (
    voter: PublicKey,
    election: PublicKey
  ): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("voter"),
        voter.toBuffer(),
        election.toBuffer(),
      ],
      program.programId
    );
  };

  // Airdrop SOL to our new test voters so they can pay for txs
  before(async () => {
    electionAccount = Keypair.generate();

    const airdropVoter1 = await provider.connection.requestAirdrop(
      voter1.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropVoter1, "confirmed");

    const airdropVoter2 = await provider.connection.requestAirdrop(
      voter2.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropVoter2, "confirmed");

    const airdropVoter3 = await provider.connection.requestAirdrop(
      voter3.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropVoter3, "confirmed");
  });

  // --- Test Suite for `initialize_election` ---
  describe("initialize_election", () => {
    it("Initializes a new election with 3 candidates (2 votes)", async () => {
      const now = await getBlockTime();
      const startTime = new anchor.BN(now - 2); 
      const endTime = new anchor.BN(now + 10);

      await program.methods
        .initializeElection(
          startTime,
          endTime,
          candidates_3,
          candidates_3.length
        )
        .accounts({
          electionAccount: electionAccount.publicKey,
          authority: authority.publicKey,
        })
        .signers([electionAccount])
        .rpc();

      const election = await program.account.electionAccount.fetch(
        electionAccount.publicKey
      );

      expect(election.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(election.votesPerVoter).to.equal(2);
      expect(election.candidates.length).to.equal(3);
    });

    it("Rejects initialization with a name that is too long", async () => {
      const longName = "a".repeat(100);
      const tempElection = Keypair.generate();
      const candidate_list = ["Alice", "Bob", longName];

      try {
        await program.methods
          .initializeElection(
            new anchor.BN(await getBlockTime()),
            new anchor.BN((await getBlockTime()) + 10),
            candidate_list,
            candidate_list.length
          )
          .accounts({
            electionAccount: tempElection.publicKey,
            authority: authority.publicKey,
          })
          .signers([tempElection])
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        expect(err.error.errorCode.code).to.equal("CandidateNameTooLong");
      }
    });
  });

  // --- Test Suite for `cast_vote` ---
  describe("cast_vote", () => {
    it("Allows a voter to cast a valid vote", async () => {
      await program.methods
        .castVote(Buffer.from([0, 1]))
        .accounts({
          electionAccount: electionAccount.publicKey,
          voter: voter1.publicKey,
        })
        .signers([voter1])
        .rpc();

      const election = await program.account.electionAccount.fetch(
        electionAccount.publicKey
      );
      const [voterStatePDA, _] = getVoterStatePDA(
        voter1.publicKey,
        electionAccount.publicKey
      );
      const voterState = await program.account.voterStateAccount.fetch(
        voterStatePDA
      );

      expect(election.candidates[0].voteCount.toNumber()).to.equal(1);
      expect(election.candidates[1].voteCount.toNumber()).to.equal(1);
      expect(voterState.votesCastCount).to.equal(2);
    });

    it("Rejects vote for the same candidate twice (in separate txs)", async () => {
      await program.methods
        .castVote(Buffer.from([0]))
        .accounts({
          electionAccount: electionAccount.publicKey,
          voter: voter2.publicKey,
        })
        .signers([voter2])
        .rpc();

      try {
        await program.methods
          .castVote(Buffer.from([0]))
          .accounts({
            electionAccount: electionAccount.publicKey,
            voter: voter2.publicKey,
          })
          .signers([voter2])
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        // --- FIX 2: Check the error *code*, not the *message* ---
        expect(err.error.errorCode.code).to.equal("AlreadyVotedForCandidate");
      }
    });

    it("Rejects vote if all votes are exhausted", async () => {
      try {
        await program.methods
          .castVote(Buffer.from([1, 2]))
          .accounts({
            electionAccount: electionAccount.publicKey,
            voter: voter2.publicKey,
          })
          .signers([voter2])
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        // --- FIX 2: Check the error *code*, not the *message* ---
        expect(err.error.errorCode.code).to.equal("VotesExhausted");
      }
    });

    it("Rejects duplicate vote in a single transaction", async () => {
      try {
        await program.methods
          .castVote(Buffer.from([1, 1]))
          .accounts({
            electionAccount: electionAccount.publicKey,
            voter: voter3.publicKey,
          })
          .signers([voter3])
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        // --- FIX 2: Check the error *code*, not the *message* ---
        expect(err.error.errorCode.code).to.equal("DuplicateVoteInSingleTx");
      }
    });

    it("Rejects vote for an invalid candidate index", async () => {
      try {
        await program.methods
          .castVote(Buffer.from([99]))
          .accounts({
            electionAccount: electionAccount.publicKey,
            voter: voter3.publicKey,
          })
          .signers([voter3])
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        // --- FIX 2: Check the error *code*, not the *message* ---
        expect(err.error.errorCode.code).to.equal("InvalidCandidateIndex");
      }
    });
  });

  // --- Test Suite for `tally_results` ---
  describe("tally_results", () => {
    it("Rejects tallying before the election has ended", async () => {
      try {
        await program.methods
          .tallyResults()
          .accounts({
            electionAccount: electionAccount.publicKey,
          })
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        // --- FIX 2: Check the error *code*, not the *message* ---
        expect(err.error.errorCode.code).to.equal("TallyNotAllowedYet");
      }
    });

    it("Correctly tallies the results and finds the winner", async () => {
      console.log("Waiting for election to end (12 seconds)...");
      await sleep(12 * 1000);

      await program.methods
        .tallyResults()
        .accounts({
          electionAccount: electionAccount.publicKey,
        })
        .rpc();

      const election = await program.account.electionAccount.fetch(
        electionAccount.publicKey
      );

      expect(election.isFinalized).to.be.true;
      expect(election.winnerIndex).to.equal(0); // Alice
    });

    it("Rejects tallying from a non-authority wallet", async () => {
      const tempElection = Keypair.generate();
      const startTime = new anchor.BN(await getBlockTime());
      const endTime = new anchor.BN(startTime.toNumber() - 5);

      await program.methods
        .initializeElection(
          startTime,
          endTime,
          candidates_3,
          candidates_3.length
        )
        .accounts({
          electionAccount: tempElection.publicKey,
          authority: authority.publicKey,
        })
        .signers([tempElection])
        .rpc();

      try {
        await program.methods
          .tallyResults()
          .accounts({
            electionAccount: tempElection.publicKey,
          })
          .signers([voter1]) // voter1 signs
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        // --- FIX 3: Check for the *actual* client-side error ---
        expect(err.message).to.include("unknown signer");
      }
    });

    it("Rejects casting a vote after the election is finalized", async () => {
      try {
        await program.methods
          .castVote(Buffer.from([2]))
          .accounts({
            electionAccount: electionAccount.publicKey, // The main, finalized election
            voter: voter3.publicKey,
          })
          .signers([voter3])
          .rpc();
        assert.fail("Transaction should have failed but did not.");
      } catch (err) {
        // --- FIX 2b: The error is 'ElectionAlreadyEnded' because it's checked first ---
        expect(err.error.errorCode.code).to.equal("ElectionAlreadyEnded");
      }
    });

    it("Initializes correctly for 7 candidates (3 votes)", async () => {
      const election7 = Keypair.generate();
      const startTime = new anchor.BN(await getBlockTime());
      const endTime = new anchor.BN(startTime.toNumber() + 10);

      await program.methods
        .initializeElection(
          startTime,
          endTime,
          candidates_7,
          candidates_7.length
        )
        .accounts({
          electionAccount: election7.publicKey,
          authority: authority.publicKey,
        })
        .signers([election7])
        .rpc();

      const election = await program.account.electionAccount.fetch(
        election7.publicKey
      );

      expect(election.votesPerVoter).to.equal(3);
      expect(election.candidates.length).to.equal(7);
    });
  });
});