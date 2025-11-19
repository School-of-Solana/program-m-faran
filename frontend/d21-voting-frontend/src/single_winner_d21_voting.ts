/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/single_winner_d21_voting.json`.
 */
export type SingleWinnerD21Voting = {
  "address": "EkhBeXScKHxKRbBud3mqCpK4aE7dnpNfCFKoPCDeCBDH",
  "metadata": {
    "name": "singleWinnerD21Voting",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "castVote",
      "docs": [
        "Instruction for a voter to cast their D21 votes."
      ],
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "electionAccount",
          "writable": true
        },
        {
          "name": "voterStateAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "account",
                "path": "electionAccount"
              }
            ]
          }
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "candidateIndices",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "initializeElection",
      "discriminator": [
        59,
        166,
        191,
        126,
        195,
        0,
        153,
        168
      ],
      "accounts": [
        {
          "name": "electionAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "startTimestamp",
          "type": "i64"
        },
        {
          "name": "endTimestamp",
          "type": "i64"
        },
        {
          "name": "candidateNames",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "candidateCount",
          "type": "u8"
        }
      ]
    },
    {
      "name": "tallyResults",
      "docs": [
        "Instruction (for the authority) to tally the results",
        "and declare a winner after the election has ended."
      ],
      "discriminator": [
        113,
        45,
        25,
        227,
        254,
        255,
        255,
        141
      ],
      "accounts": [
        {
          "name": "electionAccount",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "electionAccount"
          ]
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "electionAccount",
      "discriminator": [
        111,
        137,
        198,
        158,
        227,
        5,
        86,
        255
      ]
    },
    {
      "name": "voterStateAccount",
      "discriminator": [
        163,
        253,
        89,
        187,
        180,
        155,
        138,
        208
      ]
    }
  ],
  "events": [
    {
      "name": "electionFinalized",
      "discriminator": [
        157,
        190,
        148,
        125,
        38,
        106,
        119,
        253
      ]
    },
    {
      "name": "voteCasted",
      "discriminator": [
        156,
        98,
        66,
        40,
        149,
        79,
        255,
        51
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "electionNotStarted",
      "msg": "The election has not started yet."
    },
    {
      "code": 6001,
      "name": "electionAlreadyEnded",
      "msg": "The election has already ended."
    },
    {
      "code": 6002,
      "name": "electionAlreadyFinalized",
      "msg": "The election has already been finalized and a winner declared."
    },
    {
      "code": 6003,
      "name": "tallyNotAllowedYet",
      "msg": "Cannot tally results until the election has ended."
    },
    {
      "code": 6004,
      "name": "votesExhausted",
      "msg": "You have already used all your available votes."
    },
    {
      "code": 6005,
      "name": "alreadyVotedForCandidate",
      "msg": "You cannot vote for the same candidate more than once."
    },
    {
      "code": 6006,
      "name": "duplicateVoteInSingleTx",
      "msg": "Your vote request contains duplicate candidates in the same transaction."
    },
    {
      "code": 6007,
      "name": "invalidCandidateIndex",
      "msg": "The provided candidate index is invalid."
    },
    {
      "code": 6008,
      "name": "candidateCountMismatch",
      "msg": "The provided candidate count does not match the candidate list length."
    },
    {
      "code": 6009,
      "name": "candidateNameTooLong",
      "msg": "A candidate name is too long."
    }
  ],
  "types": [
    {
      "name": "candidate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "voteCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "electionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The authority (admin) who created and can end the election."
            ],
            "type": "pubkey"
          },
          {
            "name": "startTimestamp",
            "docs": [
              "Unix timestamp when voting can begin."
            ],
            "type": "i64"
          },
          {
            "name": "endTimestamp",
            "docs": [
              "Unix timestamp when voting must end."
            ],
            "type": "i64"
          },
          {
            "name": "votesPerVoter",
            "docs": [
              "The number of votes each person gets (e.g., 2)."
            ],
            "type": "u8"
          },
          {
            "name": "isFinalized",
            "docs": [
              "Has the winner been declared?"
            ],
            "type": "bool"
          },
          {
            "name": "winnerIndex",
            "docs": [
              "The index of the winning candidate, if finalized."
            ],
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "candidates",
            "docs": [
              "A list of all candidates."
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "candidate"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "electionFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "docs": [
              "The election that was finalized."
            ],
            "type": "pubkey"
          },
          {
            "name": "winnerIndex",
            "docs": [
              "The index of the winning candidate."
            ],
            "type": "u8"
          },
          {
            "name": "winnerName",
            "docs": [
              "The name of the winning candidate."
            ],
            "type": "string"
          },
          {
            "name": "winnerVoteCount",
            "docs": [
              "The total votes the winner received."
            ],
            "type": "u64"
          },
          {
            "name": "timestamp",
            "docs": [
              "The timestamp of the finalization."
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voteCasted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "docs": [
              "The wallet of the voter."
            ],
            "type": "pubkey"
          },
          {
            "name": "election",
            "docs": [
              "The election they voted in."
            ],
            "type": "pubkey"
          },
          {
            "name": "candidatesVotedFor",
            "docs": [
              "The list of candidate indices they just voted for."
            ],
            "type": "bytes"
          },
          {
            "name": "timestamp",
            "docs": [
              "The timestamp of the vote."
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voterStateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voterPubkey",
            "docs": [
              "The wallet of the person who voted."
            ],
            "type": "pubkey"
          },
          {
            "name": "electionPubkey",
            "docs": [
              "Which election this ballot is for."
            ],
            "type": "pubkey"
          },
          {
            "name": "votesCastCount",
            "docs": [
              "How many votes this person has used so far."
            ],
            "type": "u8"
          },
          {
            "name": "votedForIndices",
            "docs": [
              "A list of candidate indices this user has *already* voted for."
            ],
            "type": "bytes"
          }
        ]
      }
    }
  ]
};
