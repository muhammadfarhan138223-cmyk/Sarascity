/* Original campaign data. */
window.SarasCampaign = {
  "version": 2,
  "title": "Andheray ke Paar",
  "chapters": [
    "ACT I · Band shehar",
    "ACT II · Do chehre",
    "ACT III · Roshan shehar"
  ],
  "missions": [
    {
      "id": "sc2_1",
      "title": "Bijli band",
      "giver": "home",
      "intro": "Sadar Bazaar ki lights achanak band hain. Mechanic ko fault ki report chahiye.",
      "steps": [
        {
          "type": "goto",
          "lm": "petrol",
          "text": "Gaari se mechanic ke paas jao.",
          "veh": "car"
        },
        {
          "type": "intel",
          "lm": "bazaar",
          "text": "Foot par damaged panel inspect karo.",
          "seconds": 6
        }
      ],
      "time": 600,
      "reward": {
        "money": 500,
        "xp": 70
      },
      "chapter": 0,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_2",
      "title": "Band lifafa",
      "giver": "bazaar",
      "intro": "Panel par aik band lifafa mila hai. Hospital volunteer isay pehchanti hai.",
      "steps": [
        {
          "type": "intel",
          "lm": "bazaar",
          "text": "Parcel ki seal check karo.",
          "seconds": 6
        },
        {
          "type": "goto",
          "lm": "hospital",
          "text": "Volunteer ko parcel do.",
          "veh": "any"
        }
      ],
      "time": 600,
      "reward": {
        "money": 620,
        "xp": 82
      },
      "chapter": 0,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_3",
      "title": "Aakhri sawari",
      "giver": "hospital",
      "intro": "Gawah Plaza par phansa hai. Usay Cricket Ground ke safe point tak le jao.",
      "steps": [
        {
          "type": "pickup",
          "lm": "mall",
          "text": "Plaza par gaari rok kar gawah ko bithao."
        },
        {
          "type": "goto",
          "lm": "stadium",
          "text": "Gawah ko Cricket Ground chhoro.",
          "veh": "car"
        }
      ],
      "time": 600,
      "reward": {
        "money": 740,
        "xp": 94
      },
      "chapter": 0,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_4",
      "title": "Pehla suraagh",
      "giver": "stadium",
      "intro": "Gawah ne Jinnah Park mein aik chhupa register dekha tha.",
      "steps": [
        {
          "type": "intel",
          "lm": "park",
          "text": "Park ke marker par register talash karo.",
          "seconds": 7
        },
        {
          "type": "goto",
          "lm": "home",
          "text": "Register workshop le jao.",
          "veh": "any"
        }
      ],
      "time": 600,
      "reward": {
        "money": 860,
        "xp": 106
      },
      "chapter": 0,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_5",
      "title": "Safed Mehran",
      "giver": "home",
      "intro": "Safed hatchback register ko dhoond rahi hai. Uska route trace karo.",
      "steps": [
        {
          "type": "chase",
          "lm": "bazaar",
          "speed": 18,
          "text": "Target ke 13m andar 5 seconds raho · red marker"
        },
        {
          "type": "goto",
          "lm": "petrol",
          "text": "Mechanic ko route ki khabar do.",
          "veh": "car"
        }
      ],
      "time": 600,
      "reward": {
        "money": 980,
        "xp": 118
      },
      "chapter": 0,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_6",
      "title": "Raat ki tasveer",
      "giver": "petrol",
      "intro": "Plaza ki CCTV se saboot mil sakta hai. Terminal ko on foot inspect karo.",
      "steps": [
        {
          "type": "intel",
          "lm": "mall",
          "text": "CCTV terminal se footage copy karo.",
          "seconds": 8
        },
        {
          "type": "goto",
          "lm": "police",
          "text": "Footage Thana tak pahunchao.",
          "veh": "any"
        }
      ],
      "time": 600,
      "reward": {
        "money": 1100,
        "xp": 130
      },
      "chapter": 0,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_7",
      "title": "Band gali",
      "giver": "police",
      "intro": "Attackers gawah ke peeche hain. Ground par usay cover do.",
      "steps": [
        {
          "type": "goto",
          "lm": "stadium",
          "text": "Ground par pahuncho.",
          "veh": "any"
        },
        {
          "type": "kill",
          "lm": "stadium",
          "n": 3,
          "boss": false,
          "text": "Marked attackers ko on foot roko · F / Attack"
        }
      ],
      "time": 600,
      "reward": {
        "money": 1220,
        "xp": 142
      },
      "chapter": 0,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_8",
      "title": "Nikalne ka raasta",
      "giver": "stadium",
      "intro": "Attackers ne tumhari gaari ka number report kar diya. Safe house tak niklo.",
      "steps": [
        {
          "type": "goto",
          "lm": "home",
          "text": "Gaari se safe house pahuncho.",
          "veh": "car"
        },
        {
          "type": "evade",
          "text": "Police ki nazar se bahar raho jab tak stars khatam hon."
        }
      ],
      "time": 600,
      "reward": {
        "money": 1340,
        "xp": 154
      },
      "chapter": 0,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_9",
      "title": "Naya din",
      "giver": "home",
      "intro": "Workshop ki supplies phans gayi hain. Mohally ka route dobara kholo.",
      "steps": [
        {
          "type": "goto",
          "lm": "petrol",
          "text": "Workshop supplies uthao.",
          "veh": "any"
        },
        {
          "type": "goto",
          "lm": "bazaar",
          "text": "Supplies Bazaar pahunchao.",
          "veh": "any"
        }
      ],
      "time": 600,
      "reward": {
        "money": 1460,
        "xp": 166
      },
      "chapter": 1,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_10",
      "title": "Route trial",
      "giver": "bazaar",
      "intro": "Courier network ko tez driver chahiye. Trial jeet kar andar ki khabar lo.",
      "steps": [
        {
          "type": "race",
          "cps": [
            [
              1,
              1
            ],
            [
              3,
              1
            ],
            [
              5,
              3
            ],
            [
              3,
              5
            ],
            [
              1,
              3
            ]
          ],
          "text": "Rivals se pehle marked checkpoints cross karo"
        }
      ],
      "time": 600,
      "reward": {
        "money": 1580,
        "xp": 178
      },
      "chapter": 1,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_11",
      "title": "Laapata courier",
      "giver": "mall",
      "intro": "Courier ki gaari route badal rahi hai. Follow karke message lo.",
      "steps": [
        {
          "type": "chase",
          "lm": "mall",
          "speed": 20,
          "text": "Target ke 13m andar 5 seconds raho · red marker"
        },
        {
          "type": "intel",
          "lm": "park",
          "text": "Dead drop se courier ka message lo.",
          "seconds": 6
        }
      ],
      "time": 600,
      "reward": {
        "money": 1700,
        "xp": 190
      },
      "chapter": 1,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_12",
      "title": "Do saboot",
      "giver": "park",
      "intro": "Register ke numbers hospital record aur petrol receipt se milao.",
      "steps": [
        {
          "type": "intel",
          "lm": "hospital",
          "text": "Delivery record check karo.",
          "seconds": 6
        },
        {
          "type": "intel",
          "lm": "petrol",
          "text": "Petrol receipt inspect karo.",
          "seconds": 6
        }
      ],
      "time": 600,
      "reward": {
        "money": 1820,
        "xp": 202
      },
      "chapter": 1,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_13",
      "title": "Workshop par hamla",
      "giver": "petrol",
      "intro": "Workshop par attackers jama hain. Mohally ko safe karo.",
      "steps": [
        {
          "type": "goto",
          "lm": "home",
          "text": "Workshop wapas pahuncho.",
          "veh": "any"
        },
        {
          "type": "kill",
          "lm": "home",
          "n": 4,
          "boss": false,
          "text": "Marked attackers ko on foot roko · F / Attack"
        }
      ],
      "time": 600,
      "reward": {
        "money": 1940,
        "xp": 214
      },
      "chapter": 1,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_14",
      "title": "Baarish ka safar",
      "giver": "home",
      "intro": "Baarish mein dawa ki emergency delivery chahiye. Raasta sambhal kar chalo.",
      "steps": [
        {
          "type": "goto",
          "lm": "bazaar",
          "text": "Medical box uthao.",
          "veh": "any"
        },
        {
          "type": "goto",
          "lm": "hospital",
          "text": "Dawa hospital pahunchao.",
          "veh": "car"
        }
      ],
      "time": 600,
      "reward": {
        "money": 2060,
        "xp": 226
      },
      "chapter": 1,
      "night": false,
      "weather": "rain"
    },
    {
      "id": "sc2_15",
      "title": "Radio khamosh",
      "giver": "hospital",
      "intro": "Gawah ka radio park ke paas band hua. Aakhri signal trace karo.",
      "steps": [
        {
          "type": "intel",
          "lm": "park",
          "text": "Last signal inspect karo.",
          "seconds": 8
        },
        {
          "type": "intel",
          "lm": "stadium",
          "text": "Receiver par message decode karo.",
          "seconds": 6
        }
      ],
      "time": 600,
      "reward": {
        "money": 2180,
        "xp": 238
      },
      "chapter": 1,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_16",
      "title": "Teesra raasta",
      "giver": "stadium",
      "intro": "Courier network ka final test tumhein warehouse ke contact tak le jayega.",
      "steps": [
        {
          "type": "race",
          "cps": [
            [
              2,
              2
            ],
            [
              5,
              2
            ],
            [
              6,
              4
            ],
            [
              4,
              6
            ],
            [
              1,
              5
            ],
            [
              1,
              2
            ]
          ],
          "text": "Rivals se pehle marked checkpoints cross karo"
        }
      ],
      "time": 600,
      "reward": {
        "money": 2300,
        "xp": 250
      },
      "chapter": 1,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_17",
      "title": "Chhupa daftar",
      "giver": "mall",
      "intro": "Plaza ka record smugglers ki timings batata hai. Evidence back up karo.",
      "steps": [
        {
          "type": "intel",
          "lm": "mall",
          "text": "On foot terminal inspect karo.",
          "seconds": 10
        },
        {
          "type": "goto",
          "lm": "home",
          "text": "Workshop mein backup rakho.",
          "veh": "any"
        }
      ],
      "time": 600,
      "reward": {
        "money": 2420,
        "xp": 262
      },
      "chapter": 2,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_18",
      "title": "Andheri deal",
      "giver": "home",
      "intro": "Bazaar mein attackers courier ka raasta roke hue hain.",
      "steps": [
        {
          "type": "goto",
          "lm": "bazaar",
          "text": "Bazaar marker tak jao.",
          "veh": "any"
        },
        {
          "type": "kill",
          "lm": "bazaar",
          "n": 3,
          "boss": false,
          "text": "Marked attackers ko on foot roko · F / Attack"
        }
      ],
      "time": 600,
      "reward": {
        "money": 2540,
        "xp": 274
      },
      "chapter": 2,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_19",
      "title": "Aakhri convoy",
      "giver": "bazaar",
      "intro": "Convoy ki lead gaari nikal rahi hai. Usay nazar se ojhal mat hone do.",
      "steps": [
        {
          "type": "chase",
          "lm": "petrol",
          "speed": 23,
          "text": "Target ke 13m andar 5 seconds raho · red marker"
        },
        {
          "type": "goto",
          "lm": "police",
          "text": "Convoy route Thana pahunchao.",
          "veh": "car"
        }
      ],
      "time": 600,
      "reward": {
        "money": 2660,
        "xp": 286
      },
      "chapter": 2,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_20",
      "title": "Ghalat ilzaam",
      "giver": "police",
      "intro": "Network ne tumhari pehchan leak kar di. Pursuit se nikal kar saboot bachao.",
      "steps": [
        {
          "type": "goto",
          "lm": "park",
          "text": "Park ke safe route tak jao.",
          "veh": "car"
        },
        {
          "type": "evade",
          "text": "Pursuit se bach kar wanted stars khatam karo."
        }
      ],
      "time": 600,
      "reward": {
        "money": 2780,
        "xp": 298
      },
      "chapter": 2,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_21",
      "title": "Gawah ki hifazat",
      "giver": "park",
      "intro": "Gawah Plaza par laut aya hai. Usay safe point tak le jao.",
      "steps": [
        {
          "type": "pickup",
          "lm": "mall",
          "text": "Plaza par gaari rok kar gawah ko uthao."
        },
        {
          "type": "goto",
          "lm": "stadium",
          "text": "Gawah ko ground pahunchao.",
          "veh": "car"
        }
      ],
      "time": 600,
      "reward": {
        "money": 2900,
        "xp": 310
      },
      "chapter": 2,
      "night": false,
      "weather": "clear"
    },
    {
      "id": "sc2_22",
      "title": "Subah se pehle",
      "giver": "stadium",
      "intro": "Ledger mil gaya. Backup aur original do alag jagahon par jama karo.",
      "steps": [
        {
          "type": "intel",
          "lm": "stadium",
          "text": "Ledger ki copy banao.",
          "seconds": 6
        },
        {
          "type": "goto",
          "lm": "hospital",
          "text": "Backup volunteer ko do.",
          "veh": "any"
        },
        {
          "type": "goto",
          "lm": "police",
          "text": "Original Thana mein jama karo.",
          "veh": "any"
        }
      ],
      "time": 600,
      "reward": {
        "money": 3020,
        "xp": 322
      },
      "chapter": 2,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_23",
      "title": "Aakhri muqabla",
      "giver": "police",
      "intro": "Network ka leader Plaza mein evidence mita raha hai. Usay roko.",
      "steps": [
        {
          "type": "goto",
          "lm": "mall",
          "text": "Plaza par pahuncho.",
          "veh": "any"
        },
        {
          "type": "kill",
          "lm": "mall",
          "n": 3,
          "boss": true,
          "text": "Marked attackers ko on foot roko · F / Attack"
        },
        {
          "type": "intel",
          "lm": "mall",
          "text": "Final evidence recover karo.",
          "seconds": 6
        }
      ],
      "time": 600,
      "reward": {
        "money": 3140,
        "xp": 334
      },
      "chapter": 2,
      "night": true,
      "weather": "clear"
    },
    {
      "id": "sc2_24",
      "title": "Roshan shehar",
      "giver": "mall",
      "intro": "Network expose ho gaya. Mohalla tumhari workshop par intezar kar raha hai.",
      "steps": [
        {
          "type": "goto",
          "lm": "petrol",
          "text": "Mechanic se generator lo.",
          "veh": "any"
        },
        {
          "type": "goto",
          "lm": "bazaar",
          "text": "Restored lights check karo.",
          "veh": "any"
        },
        {
          "type": "goto",
          "lm": "home",
          "text": "Workshop aa kar campaign complete karo.",
          "veh": "any"
        }
      ],
      "time": 600,
      "reward": {
        "money": 3260,
        "xp": 346
      },
      "chapter": 2,
      "night": false,
      "weather": "clear"
    }
  ]
};
