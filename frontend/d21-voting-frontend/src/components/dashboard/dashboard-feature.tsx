import { useState, useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN, Idl, web3 } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import toast from 'react-hot-toast';

// --- IMPORTS ---
// 1. The IDL JSON (Keep this where you put it)
import idl from '../../single_winner_d21_voting.json';
// 2. The TypeScript Type Definition (You just pasted this in Step 2)
import { SingleWinnerD21Voting } from '../../single_winner_d21_voting';

// Your Deployed Program ID
const PROGRAM_ID = new PublicKey("EkhBeXScKHxKRbBud3mqCpK4aE7dnpNfCFKoPCDeCBDH");

export default function DashboardFeature() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  // --- State ---
  const [electionAddress, setElectionAddress] = useState("");
  const [electionAccount, setElectionAccount] = useState<any>(null);
  const [voterState, setVoterState] = useState<any>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Admin Inputs
  const [newCandidateNames, setNewCandidateNames] = useState("");
  const [duration, setDuration] = useState(60);

  // --- ANCHOR PROGRAM INSTANCE ---
  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: 'processed',
    });

    return new Program<SingleWinnerD21Voting>(
      idl as SingleWinnerD21Voting, 
      provider
    );
  }, [connection, wallet]);

  // --- DATA FETCHING ---
  const fetchElectionData = async (address: string) => {
    if (!program || !address) return;
    try {
      const pubkey = new PublicKey(address);
      
      // Fetch Election Account
      // This works now because 'program' is typed correctly
      const election = await program.account.electionAccount.fetch(pubkey);
      setElectionAccount(election);

      // Fetch Voter State PDA
      const [voterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("voter"), wallet!.publicKey.toBuffer(), pubkey.toBuffer()],
        PROGRAM_ID
      );

      try {
        const vState = await program.account.voterStateAccount.fetch(voterPda);
        setVoterState(vState);
      } catch (e) {
        setVoterState(null); // User hasn't voted yet
      }
    } catch (err) {
      console.error("Error fetching:", err);
      toast.error("Could not load election. Check address.");
      setElectionAccount(null);
    }
  };

  // --- ACTIONS ---

  const initializeElection = async () => {
    if (!program || !wallet) return;
    setLoading(true);
    try {
      const newElectionKp = Keypair.generate();
      const names = newCandidateNames.split(",").map((s) => s.trim()).filter((s) => s.length > 0);

      if (names.length < 2) {
        toast.error("Please provide at least 2 candidates");
        setLoading(false);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const startTime = new BN(now); 
      const endTime = new BN(now + duration);

      await program.methods
        .initializeElection(
          startTime, 
          endTime, 
          names, 
          names.length
        )
        .accounts({
          electionAccount: newElectionKp.publicKey,
          authority: wallet.publicKey,
        })
        .signers([newElectionKp])
        .rpc();

      toast.success("Election Initialized!");
      setElectionAddress(newElectionKp.publicKey.toString());
      await fetchElectionData(newElectionKp.publicKey.toString());
    } catch (err: any) {
      console.error(err);
      toast.error("Init Failed: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const castVote = async () => {
    if (!program || !electionAccount || !wallet) return;
    setLoading(true);
    try {
      await program.methods
        .castVote(Buffer.from(selectedCandidates))
        .accounts({
          electionAccount: new PublicKey(electionAddress),
          voter: wallet.publicKey,
        })
        .rpc();

      toast.success("Vote Cast Successfully!");
      setSelectedCandidates([]);
      await fetchElectionData(electionAddress);
    } catch (err: any) {
      console.error(err);
      const msg = err.error?.errorMessage || err.message;
      toast.error("Vote Failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const tallyResults = async () => {
    if (!program || !electionAccount) return;
    setLoading(true);
    try {
      await program.methods
        .tallyResults()
        .accounts({
          electionAccount: new PublicKey(electionAddress),
        })
        .rpc();

      toast.success("Election Finalized!");
      await fetchElectionData(electionAddress);
    } catch (err: any) {
      console.error(err);
      const msg = err.error?.errorMessage || err.message;
      toast.error("Tally Failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  // --- UI HELPERS ---
  const toggleCandidate = (index: number) => {
    if (selectedCandidates.includes(index)) {
      setSelectedCandidates(selectedCandidates.filter((i) => i !== index));
    } else {
      if (selectedCandidates.length < electionAccount.votesPerVoter) {
        setSelectedCandidates([...selectedCandidates, index]);
      } else {
        toast.error(`Max ${electionAccount.votesPerVoter} votes allowed!`);
      }
    }
  };

  // --- RENDER ---
  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-base-200 p-6 rounded-xl shadow-lg mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">D21 Voting</h1>
        <p className="text-gray-500 mb-8">
          Consensus voting system on Solana Devnet
        </p>

        {!wallet ? (
          <div className="alert alert-warning">
            <span>Please connect your wallet (top right) to continue.</span>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* --- LOAD ELECTION SECTION --- */}
            <div className="bg-base-100 p-6 rounded-xl border border-base-300">
              <h2 className="text-2xl font-bold mb-4">🗳️ Active Election</h2>
              <div className="join w-full mb-6">
                <input
                  type="text"
                  placeholder="Paste Election Address..."
                  className="input input-bordered join-item flex-1 font-mono text-sm"
                  value={electionAddress}
                  onChange={(e) => setElectionAddress(e.target.value)}
                />
                <button
                  onClick={() => fetchElectionData(electionAddress)}
                  className="btn btn-primary join-item"
                  disabled={loading}
                >
                  Load
                </button>
              </div>

              {electionAccount && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4 justify-between bg-base-200 p-4 rounded-lg">
                    <div className="badge badge-lg badge-outline">
                      Votes Allowed: {electionAccount.votesPerVoter}
                    </div>
                    <div className={`badge badge-lg ${electionAccount.isFinalized ? 'badge-error' : 'badge-success'}`}>
                      Status: {electionAccount.isFinalized ? "Finalized" : "Voting Active"}
                    </div>
                    {voterState && (
                      <div className="badge badge-lg badge-info">
                        You Voted: {voterState.votesCastCount} time(s)
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {electionAccount.candidates.map((c: any, idx: number) => {
                      const isSelected = selectedCandidates.includes(idx);
                      const isWinner = electionAccount.winnerIndex === idx;
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => !electionAccount.isFinalized && toggleCandidate(idx)}
                          className={`
                            p-4 rounded-lg border-2 flex justify-between items-center transition-all
                            ${electionAccount.isFinalized ? 'cursor-default opacity-80' : 'cursor-pointer hover:bg-base-200'}
                            ${isSelected ? 'border-primary bg-primary/10' : 'border-base-300'}
                            ${isWinner ? 'border-yellow-400 bg-yellow-400/10 ring-2 ring-yellow-400' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm opacity-50">#{idx}</span>
                            <span className="font-bold text-lg">{c.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {isWinner && <span className="text-yellow-500 font-black tracking-wider">WINNER 🏆</span>}
                            {isSelected && !electionAccount.isFinalized && <span className="text-primary font-bold">Selected</span>}
                            <div className="badge badge-neutral">{c.voteCount.toString()} votes</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!electionAccount.isFinalized && (
                    <button
                      onClick={castVote}
                      disabled={selectedCandidates.length === 0 || loading}
                      className="btn btn-primary w-full text-lg"
                    >
                      {loading ? "Processing..." : `Cast ${selectedCandidates.length} Vote(s)`}
                    </button>
                  )}

                  {!electionAccount.isFinalized && 
                    electionAccount.authority.toString() === wallet.publicKey.toString() && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                       <button
                         onClick={tallyResults}
                         disabled={loading}
                         className="btn btn-error btn-outline w-full"
                       >
                         End Election & Tally Results
                       </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* --- CREATE ELECTION SECTION --- */}
            <div className="bg-base-100 p-6 rounded-xl border border-base-300">
              <h2 className="text-xl font-bold mb-4 text-gray-400">Create New Election</h2>
              <div className="grid gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Candidates (comma separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Alice, Bob, Charlie..."
                    className="input input-bordered"
                    value={newCandidateNames}
                    onChange={(e) => setNewCandidateNames(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Duration (seconds)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                </div>
                <button
                  onClick={initializeElection}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? "Initializing..." : "Initialize Election"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}