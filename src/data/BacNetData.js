export const BacNetData = {
  dyeing: {
    incoming: {
      lesco: 14140,
      kgl: 14040,
      solar: 40240,
      boiler_out: 14440,
      total_current: 20,
      total_kwh_today: 6,
    },

    departmentTotals: {
      pretreatment: { load: 7, todayKwh: 1 },
      dyeing: { load: 8, todayKwh: 2 },
      finishing: { load: 9, todayKwh: 3 },
      utility: { load: 10, todayKwh: 4 },
      power_dbs: { load: 11, todayKwh: 5 },
      kgl_boiler: { power: 13340, todayKwh: 2000033 },
    },

    departments: {
      pretreatment: {
        new_mercerizing: {
          name: "New Mercerizing",
          status: 12400,
          power: 12440,
          amp: 12431,
          kwh: 12400,
        },
        old_mercerizing_singeing_01: {
          name: "Old Mercerizing & Singeing 01",
          status: 12500,
          power: 12540,
          amp: 12531,
          kwh: 12500,
        },
        singeing_02: {
          name: "Singeing 02",
          status: 12600,
          power: 12640,
          amp: 12631,
          kwh: 12600,
        },
        new_bleach: {
          name: "New Bleach",
          status: 12700,
          power: 12740,
          amp: 12731,
          kwh: 12700,
        },
        old_bleach: {
          name: "Old Bleach",
          status: 12800,
          power: 12840,
          amp: 12831,
          kwh: 12800,
        },
      },

      dyeing: {
        padsteam_1: {
          name: "Padsteam No.1",
          status: 11800,
          power: 11840,
          amp: 11831,
          kwh: 11800,
        },
        padsteam_2: {
          name: "Padsteam No.2",
          status: 11900,
          power: 11940,
          amp: 11931,
          kwh: 11900,
        },
        padsteam_3: {
          name: "Padsteam No.3",
          status: 12000,
          power: 12040,
          amp: 12031,
          kwh: 12000,
        },
        thermosol_1: {
          name: "Thermosol No.1",
          status: 12100,
          power: 12140,
          amp: 12131,
          kwh: 12100,
        },
        thermosol_2: {
          name: "Thermosol No.2",
          status: 12200,
          power: 12240,
          amp: 12231,
          kwh: 12200,
        },
        thermosol_3: {
          name: "Thermosol No.3",
          status: 12300,
          power: 12340,
          amp: 12331,
          kwh: 12300,
        },
      },

      finishing: {
        stenter_1: {
          name: "Stenter 1",
          status: 10200,
          power: 10240,
          amp: 10231,
          kwh: 10200,
        },
        stenter_2: {
          name: "Stenter 2",
          status: 10300,
          power: 10340,
          amp: 10331,
          kwh: 10300,
        },
        stenter_3: {
          name: "Stenter 3",
          status: 10400,
          power: 10440,
          amp: 10431,
          kwh: 10400,
        },
        stenter_4: {
          name: "Stenter 4",
          status: 10500,
          power: 10540,
          amp: 10531,
          kwh: 10500,
        },
        pantek: {
          name: "Pantek",
          status: 13100,
          power: 13140,
          amp: 13131,
          kwh: 13100,
        },
        sanfo_1_2: {
          name: "Sanfo 1 & 2",
          status: 10700,
          power: 10740,
          amp: 10731,
          kwh: 10700,
        },
        mario_grosta: {
          name: "Mario Grosta",
          status: 10800,
          power: 10840,
          amp: 10831,
          kwh: 10800,
        },
      },

      utility: {
        oil_heater_ac: {
          name: "Oil Heater A+C",
          status: 11300,
          power: 11340,
          amp: 11331,
          kwh: 11300,
        },
        oil_heater_b: {
          name: "Oil Heater B",
          status: 11600,
          power: 11640,
          amp: 11631,
          kwh: 11600,
        },
        oil_heater_d: {
          name: "Oil Heater D",
          status: 11500,
          power: 11540,
          amp: 11531,
          kwh: 11500,
        },
        old_compressor: {
          name: "Old Compressor",
          status: 12900,
          power: 12940,
          amp: 12931,
          kwh: 12900,
        },
        cru: {
          name: "CRU",
          status: 13200,
          power: 13240,
          amp: 13231,
          kwh: 13200,
        },
        booster_pump: {
          name: "Booster Pump",
          status: 13700,
          power: 13740,
          amp: 13731,
          kwh: 13700,
        },
        new_compressor: {
          name: "New Compressor",
          status: 13000,
          power: 13040,
          amp: 13031,
          kwh: 13000,
        },
      },

      power_dbs: {
        qa_hall_mldb1: {
          name: "QA Hall + MLDB No.1",
          status: 10600,
          power: 10640,
          amp: 10631,
          kwh: 10600,
        },
        pdb1_mldb2: {
          name: "PDB1 + MLDB No.2",
          status: 10700,
          power: 10740,
          amp: 10731,
          kwh: 10700,
        },
        pdb2_laffer: {
          name: "PDB2 + Laffer Hall",
          status: 10800,
          power: 10840,
          amp: 10831,
          kwh: 10800,
        },
        pdb_04: {
          name: "PDB No.04",
          status: 10900,
          power: 10940,
          amp: 10931,
          kwh: 10900,
        },
        pdb_06: {
          name: "PDB No.06",
          status: 11000,
          power: 11040,
          amp: 11031,
          kwh: 11000,
        },
        pdb_07_turbine: {
          name: "PDB No.07 + Turbine 1,2",
          status: 11100,
          power: 11140,
          amp: 11131,
          kwh: 11100,
        },
        workshop: {
          name: "Elect, Mech Workshop",
          status: 11200,
          power: 11240,
          amp: 11231,
          kwh: 11200,
        },
        ro_pdb8: {
          name: "RO + PDB8",
          status: 13600,
          power: 13640,
          amp: 13631,
          kwh: 13600,
        },
      },
    },
  },

  weaving: {
    departments: {
      shed_01: {
        loom_db_1a: {
          name: "Loom DB 1A",
          status: 22700,
          power: 22740,
          amp: 22731,
          kwh: 22700,
        },
        loom_db_1b: {
          name: "Loom DB 1B",
          status: 22800,
          power: 22840,
          amp: 22831,
          kwh: 22800,
        },
        hvac_shed_01: {
          name: "HVAC Shed 01",
          status: 22300,
          power: 22340,
          amp: 22331,
          kwh: 22300,
        },
        light_db_shed_01: {
          name: "Light DB Shed 01",
          status: 24000,
          power: 24040,
          amp: 24031,
          kwh: 24000,
        },
      },

      shed_02: {
        loom_db_2a: {
          name: "Loom DB 2A",
          status: 22200,
          power: 22240,
          amp: 22231,
          kwh: 22200,
        },
        loom_db_2b: {
          name: "Loom DB 2B",
          status: 22400,
          power: 22440,
          amp: 22431,
          kwh: 22400,
        },
        loom_db_2c: {
          name: "Loom DB 2C",
          status: 22500,
          power: 22540,
          amp: 22531,
          kwh: 22500,
        },
        blower_ohc_db_2d: {
          name: "Blower OHC DB 2D",
          status: 23300,
          power: 23340,
          amp: 23331,
          kwh: 23300,
        },
        hvac_shed_02_a: {
          name: "HVAC Shed 02 A",
          status: 24300,
          power: 24340,
          amp: 24331,
          kwh: 24300,
        },
        hvac_shed_02_b: {
          name: "HVAC Shed 02 B",
          status: 24400,
          power: 24440,
          amp: 24431,
          kwh: 24400,
        },
        hvac_shed_02_c: {
          name: "HVAC Shed 02 C",
          status: 24500,
          power: 24540,
          amp: 24531,
          kwh: 24500,
        },
        light_db_shed_02: {
          name: "Light DB Shed 02",
          status: 24100,
          power: 24140,
          amp: 24131,
          kwh: 24100,
        },
      },

      shed_03: {
        loom_db_3a: {
          name: "Loom DB 3A",
          status: 24600,
          power: 24640,
          amp: 24631,
          kwh: 24600,
        },
        loom_db_3b: {
          name: "Loom DB 3B",
          status: 24700,
          power: 24740,
          amp: 24731,
          kwh: 24700,
        },
        loom_db_3c: {
          name: "Loom DB 3C",
          status: 24800,
          power: 24840,
          amp: 24831,
          kwh: 24800,
        },
        loom_db_3d: {
          name: "Loom DB 3D",
          status: 24900,
          power: 24940,
          amp: 24931,
          kwh: 24900,
        },
        loom_db_3e: {
          name: "Loom DB 3E",
          status: 25000,
          power: 25040,
          amp: 25031,
          kwh: 25000,
        },
        hvac_shed_03_a: {
          name: "HVAC Shed 03 A",
          status: 25100,
          power: 25140,
          amp: 25131,
          kwh: 25100,
        },
        hvac_shed_03_b: {
          name: "HVAC Shed 03 B",
          status: 25200,
          power: 25240,
          amp: 25231,
          kwh: 25200,
        },
        hvac_shed_03_c: {
          name: "HVAC Shed 03 C",
          status: 23700,
          power: 23740,
          amp: 23731,
          kwh: 23700,
        },
        light_db_shed_03_a: {
          name: "Light DB Shed 03 A",
          status: 25300,
          power: 25340,
          amp: 25331,
          kwh: 25300,
        },
        light_db_shed_03_b: {
          name: "Light DB Shed 03 B",
          status: 23200,
          power: 23240,
          amp: 23231,
          kwh: 23200,
        },
      },

      shed_04: {
        loom_db_shed_04: {
          name: "Loom DB Shed 04",
          status: 25600,
          power: 25640,
          amp: 25631,
          kwh: 25600,
        },
        hvac_shed_04: {
          name: "HVAC Shed 04",
          status: 25500,
          power: 25540,
          amp: 25531,
          kwh: 25500,
        },
        light_db_shed_04: {
          name: "Light DB Shed 04",
          status: 25600,
          power: 25640,
          amp: 25631,
          kwh: 25600,
        },
      },

      compressor_dryer_pump: {
        cooper_compressor_01: {
          name: "Cooper Compressor 01",
          status: 26000,
          power: 26040,
          amp: 26031,
          kwh: 26000,
        },
        cooper_compressor_02: {
          name: "Cooper Compressor 02",
          status: 26100,
          power: 26140,
          amp: 26131,
          kwh: 26100,
        },
        atlas_comp_1: {
          name: "Atlas Comp. 1",
          status: 26200,
          power: 26240,
          amp: 26231,
          kwh: 26200,
        },
        atlas_comp_2: {
          name: "Atlas Comp. 2",
          status: 26300,
          power: 26340,
          amp: 26331,
          kwh: 26300,
        },
        atlas_dryer: {
          name: "Atlas Dryer",
          status: 26400,
          power: 26440,
          amp: 26431,
          kwh: 26400,
        },
        cooling_tower_pump_db: {
          name: "Cooling Tower Pump DB",
          status: 26500,
          power: 26540,
          amp: 26531,
          kwh: 26500,
        },
        cooling_tower_fan: {
          name: "Cooling Tower Fan",
          status: 26600,
          power: 26640,
          amp: 26631,
          kwh: 26600,
        },
      },

      preparatory_back_process: {
        sizing_department: {
          name: "Sizing Department",
          status: 23100,
          power: 23140,
          amp: 23131,
          kwh: 23100,
        },
        warping_department: {
          name: "Warping Department",
          status: 23000,
          power: 23040,
          amp: 23031,
          kwh: 23000,
        },
      },

      folding: {
        folding_db: {
          name: "Folding DB",
          status: 25700,
          power: 25740,
          amp: 25731,
          kwh: 25700,
        },
        folding_light_db: {
          name: "Folding Light DB",
          status: 25800,
          power: 25840,
          amp: 25831,
          kwh: 25800,
        },
      },

      turbine: {
        water_turbine_weaving: {
          name: "Water Turbine (Weaving)",
          status: 23900,
          power: 23940,
          amp: 23931,
          kwh: 23900,
        },
      },

      admin_block: {
        head_office_weaving_offices: {
          name: "Head Office + Weaving Offices",
          status: 25900,
          power: 25940,
          amp: 25931,
          kwh: 25900,
          scale: 0.001,
        },
      },

      godown: {
        godown_weaving: {
          name: "Godown (Weaving)",
          status: 26700,
          power: 26740,
          amp: 26731,
          kwh: 26700,
        },
      },

      chiller: {
        chiller_pump_db: {
          name: "Chiller Pump DB",
          status: 23400,
          power: 23440,
          amp: 23431,
          kwh: 23400,
        },
        chiller_main: {
          name: "Chiller Main",
          status: 23500,
          power: 23540,
          amp: 23531,
          kwh: 23500,
        },
        chiller_cooling_tower: {
          name: "Chiller Cooling Tower",
          status: 23800,
          power: 23840,
          amp: 23831,
          kwh: 23800,
        },
      },

      general_light_db: {
        general_light_db_01: {
          name: "General Light DB 01",
          status: 24200,
          power: 24240,
          amp: 24231,
          kwh: 24200,
        },
        general_light_db_02: {
          name: "General Light DB 02",
          status: 26600,
          power: 26640,
          amp: 26631,
          kwh: 26600,
        },
      },

      colony_supply: {
        colony_supply_on_kgl_b_3: {
          name: "Colony Supply on KGL / B-3",
          status: 23600,
          power: 23640,
          amp: 23631,
          kwh: 23600,
        },
      },

      kgl_return_supply: {
        kgl_emergency_supply: {
          name: "KGL Emergency Supply",
          status: 26900,
          power: 26940,
          amp: 26931,
          kwh: 26900,
        },
        boiler: {
          name: "Boiler",
          status: 22900,
          power: 22940,
          amp: 22931,
          kwh: 22900,
        },
      },
    },

    htGroups: {
      ht1: {
        lesco: {
          name: "LESCO Incoming HT 1",
          status: 21600,
          power: 21640,
          amp: 21631,
          kwh: 21600,
          scale: 0.001,
        },
        kgl: {
          name: "KGL Incoming HT 1",
          status: 21700,
          power: 21740,
          amp: 21731,
          kwh: 21700,
          scale: 1000,
        },
        tr2000_out: {
          name: "Transformer 2000 KVA Outgoing HT 1",
          status: 21800,
          power: 21840,
          amp: 21831,
          kwh: 21800,
          scale: 0.001,
        },
        tr1600_out: {
          name: "Transformer 1600 KVA Outgoing HT 1",
          status: 21900,
          power: 21940,
          amp: 21931,
          kwh: 21900,
          scale: 0.001,
        },
        tr2000_in: {
          name: "Transformer 2000 KVA Incoming LT 1",
          status: 22000,
          power: 22040,
          amp: 22031,
          kwh: 22000,
          scale: 0.001,
        },
        tr1600_in: {
          name: "Transformer 1600 KVA Incoming LT 1",
          status: 22100,
          power: 22140,
          amp: 22131,
          kwh: 22100,
          scale: 0.001,
        },
      },

      ht2: {
        lesco: {
          name: "LESCO Incoming HT 2",
          status: 40400,
          power: 40440,
          amp: 40431,
          kwh: 40400,
          scale: 0.001,
        },
        kgl: {
          name: "KGL Incoming HT 2",
          status: 40500,
          power: 40540,
          amp: 40531,
          kwh: 40500,
          scale: 1000,
        },
        tr2000_out: {
          name: "Transformer 2000 KVA Outgoing HT 2",
          status: 40600,
          power: 40640,
          amp: 40631,
          kwh: 40600,
          scale: 0.001,
        },
        tr1600_out: {
          name: "Transformer 1600 KVA Outgoing HT 2",
          status: 40700,
          power: 40740,
          amp: 40731,
          kwh: 40700,
          scale: 0.001,
        },
        tr2000_in: {
          name: "Transformer 2000 KVA Incoming LT 2",
          status: 40800,
          power: 40840,
          amp: 40831,
          kwh: 40800,
          scale: 0.001,
        },
        tr1600_in: {
          name: "Transformer 1600 KVA Incoming LT 2",
          status: 27000,
          power: 27040,
          amp: 27031,
          kwh: 27000,
          scale: 0.001,
        },
      },
    },
  },

  apparel: {
    departments: {
      btd_gf: {
        btd_gf: {
          name: "BTD GF",
          status: 29400,
          power: 29440,
          amp: 29431,
          kwh: 29400,
        },
      },

      production: {
        cutting_db: {
          name: "Cutting DB",
          status: 29500,
          power: 29540,
          amp: 29531,
          kwh: 29500,
        },
        db_gf_wa_mc: {
          name: "DB-GF-WA-MC",
          status: 29600,
          power: 29640,
          amp: 29631,
          kwh: 29600,
        },
        washing_area_hanger: {
          name: "Washing Area Hanger",
          status: 29700,
          power: 29740,
          amp: 29731,
          kwh: 29700,
        },
        db_gf_fa_lt_light_fan: {
          name: "DB-GF-FA-LT (Light & Fan)",
          status: 29900,
          power: 29940,
          amp: 29931,
          kwh: 29900,
        },
        pre_finishing_hanger: {
          name: "Pre Finishing Hanger",
          status: 30000,
          power: 30040,
          amp: 30031,
          kwh: 30000,
        },
        finishing_area_hanger: {
          name: "Finishing Area Hanger",
          status: 30100,
          power: 30140,
          amp: 30131,
          kwh: 30100,
        },
        finishing_line_1_hanger: {
          name: "Finishing Line 1 Hanger",
          status: 30200,
          power: 30240,
          amp: 30231,
          kwh: 30200,
        },
        finishing_line_2_hanger: {
          name: "Finishing Line 2 Hanger",
          status: 30300,
          power: 30340,
          amp: 30331,
          kwh: 30300,
        },
        stitching_gf_loading_hanger: {
          name: "Stitching GF Loading Hanger",
          status: 31000,
          power: 31040,
          amp: 31031,
          kwh: 31000,
        },
        small_part_line_3: {
          name: "Small Part Line 3",
          status: 31100,
          power: 31140,
          amp: 31131,
          kwh: 31100,
        },
        small_part_line_4a: {
          name: "Small Part Line 4A",
          status: 31200,
          power: 31240,
          amp: 31231,
          kwh: 31200,
        },
        small_part_line_4b: {
          name: "Small Part Line 4B",
          status: 31300,
          power: 31340,
          amp: 31331,
          kwh: 31300,
        },
        dart_module: {
          name: "Dart Module",
          status: 31400,
          power: 31440,
          amp: 31431,
          kwh: 31400,
        },
        welt_pocket_module: {
          name: "Welt Pocket Module",
          status: 31500,
          power: 31540,
          amp: 31531,
          kwh: 31500,
        },
        fly_zipper: {
          name: "Fly Zipper",
          status: 31600,
          power: 31640,
          amp: 31631,
          kwh: 31600,
        },
        back_pocket: {
          name: "Back Pocket",
          status: 31700,
          power: 31740,
          amp: 31731,
          kwh: 31700,
        },
        small_part_line_5: {
          name: "Small Part Line 5",
          status: 31800,
          power: 31840,
          amp: 31831,
          kwh: 31800,
        },
        small_part_line_4c: {
          name: "Small Part Line 4c",
          status: 31900,
          power: 31940,
          amp: 31931,
          kwh: 31900,
        },
        small_part_line_3a: {
          name: "Small Part Line 3A",
          status: 32000,
          power: 32040,
          amp: 32031,
          kwh: 32000,
        },
        small_part_line_3b: {
          name: "Small Part Line 3B",
          status: 32100,
          power: 32140,
          amp: 32131,
          kwh: 32100,
        },
        press_table: {
          name: "Press Table",
          status: 32200,
          power: 32240,
          amp: 32231,
          kwh: 32200,
        },
        fusing_machine: {
          name: "Fusing Machine",
          status: 32300,
          power: 32340,
          amp: 32331,
          kwh: 32300,
        },
        db_gf_pa_lt: {
          name: "DB-GF-PA-LT",
          status: 32400,
          power: 32440,
          amp: 32431,
          kwh: 32400,
        },
        db_ff_pa_lt: {
          name: "DB-FF-PA-LT",
          status: 32600,
          power: 32640,
          amp: 32631,
          kwh: 32600,
        },
        hanger_line_1: {
          name: "Hanger Line 1",
          status: 32700,
          power: 32740,
          amp: 32731,
          kwh: 32700,
        },
        hanger_line_2: {
          name: "Hanger Line 2",
          status: 32800,
          power: 32840,
          amp: 32831,
          kwh: 32800,
        },
        hanger_line_3: {
          name: "Hanger Line 3",
          status: 32900,
          power: 32940,
          amp: 32931,
          kwh: 32900,
        },
        hanger_line_4: {
          name: "Hanger Line 4",
          status: 33000,
          power: 33040,
          amp: 33031,
          kwh: 33000,
        },
        hanger_line_5: {
          name: "Hanger Line 5",
          status: 33100,
          power: 33140,
          amp: 33131,
          kwh: 33100,
        },
        db_sf_smp: {
          name: "DB-SF-SMP",
          status: 33200,
          power: 33240,
          amp: 33231,
          kwh: 33200,
        },
      },

      admin: {
        db_gf_em_01_washing_finishing_offices: {
          name: "DB-GF-EM-01 (Washing & Finishing) Offices",
          status: 29800,
          power: 29840,
          amp: 29831,
          kwh: 29800,
        },
        db_fa_gf_v_01: {
          name: "DB-FA-GF-V-01",
          status: 30400,
          power: 30440,
          amp: 30431,
          kwh: 30400,
        },
        db_pb_gf_v_01: {
          name: "DB-PB-GF-V-01",
          status: 30500,
          power: 30540,
          amp: 30531,
          kwh: 30500,
        },
        db_fa_gf_v_01_cubical_1: {
          name: "DB-FA-GF-V-01 (CUBICAL 1)",
          status: 30600,
          power: 30640,
          amp: 30631,
          kwh: 30600,
        },
        db_fa_gf_v_01_cubical_2: {
          name: "DB-FA-GF-V-01 (CUBICAL 2)",
          status: 30700,
          power: 30740,
          amp: 30731,
          kwh: 30700,
        },
        db_gf_pa_off_01: {
          name: "DB-GF-PA-OFF-01",
          status: 30800,
          power: 30840,
          amp: 30831,
          kwh: 30800,
        },
        db_gf_pa_off_02: {
          name: "DB-GF-PA-OFF-02",
          status: 30900,
          power: 30940,
          amp: 30931,
          kwh: 30900,
        },
        db_ff_pa_off_01: {
          name: "DB-FF-PA-OFF-01",
          status: 33300,
          power: 33340,
          amp: 33331,
          kwh: 33300,
        },
        db_sf_pa_off_01: {
          name: "DB-SF-PA-OFF-01",
          status: 33400,
          power: 33440,
          amp: 33431,
          kwh: 33400,
        },
        db_sf_mkt_off_01: {
          name: "DB-SF-MKT-OFF-01",
          status: 33500,
          power: 33540,
          amp: 33531,
          kwh: 33500,
        },
        db_sf_ca_v_01_canteen: {
          name: "DB-SF-CA-V-01 (Canteen)",
          status: 33600,
          power: 33640,
          amp: 33631,
          kwh: 33600,
        },
        db_pb_ff_v_01_1: {
          name: "DB-PB-FF-V-01 (1)",
          status: 33700,
          power: 33740,
          amp: 33731,
          kwh: 33700,
        },
        db_pb_sf_v_01_1: {
          name: "DB-PB-SF-V-01 (1)",
          status: 33800,
          power: 33840,
          amp: 33831,
          kwh: 33800,
        },
        db_pb_ff_v_01_2: {
          name: "DB-PB-FF-V-01 (2)",
          status: 33900,
          power: 33940,
          amp: 33931,
          kwh: 33900,
        },
        db_pb_sf_v_01_2: {
          name: "DB-PB-SF-V-01 (2)",
          status: 34000,
          power: 34040,
          amp: 34031,
          kwh: 34000,
        },
        db_ext_01_security: {
          name: "DB-EXT-01 - Security",
          status: 34100,
          power: 34140,
          amp: 34131,
          kwh: 34100,
        },
        pole_lights: {
          name: "Pole Lights",
          status: 34300,
          power: 34340,
          amp: 34331,
          kwh: 34300,
        },
        db_hvac: {
          name: "DB HVAC",
          status: 34400,
          power: 34440,
          amp: 34431,
          kwh: 34400,
        },
        db_ups: {
          name: "DB UPS",
          status: 34500,
          power: 34540,
          amp: 34531,
          kwh: 34500,
        },
        chemical_store: {
          name: "Chemical Store",
          status: 35000,
          power: 35040,
          amp: 35031,
          kwh: 35000,
        },
      },

      btd_ff_sf: {
        btd_ff_sf: {
          name: "BTD FF + SF",
          status: 32500,
          power: 32540,
          amp: 32531,
          kwh: 32500,
        },
      },

      utilities: {
        db_ext_02_utility_building: {
          name: "DB-EXT-02 - Utility Building",
          status: 34200,
          power: 34240,
          amp: 34231,
          kwh: 34200,
        },
        db_ahf: {
          name: "DB AHF",
          status: 34600,
          power: 34640,
          amp: 34631,
          kwh: 34600,
        },
        db_pump_room: {
          name: "DB Pump Room",
          status: 34700,
          power: 34740,
          amp: 34731,
          kwh: 34700,
        },
        db_ro_plant: {
          name: "DB RO Plant",
          status: 34800,
          power: 34840,
          amp: 34831,
          kwh: 34800,
        },
        db_compressor: {
          name: "DB Compressor",
          status: 34900,
          power: 34940,
          amp: 34931,
          kwh: 34900,
        },
        solar: {
          name: "Solar",
          status: 35100,
          power: 35140,
          amp: 35131,
          kwh: 35100,
        },
      },

      spare: {
        acb_1600a_spare: {
          name: "ACB 1600A Spare",
          status: 35200,
          power: 35240,
          amp: 35231,
          kwh: 35200,
        },
        mccb_160a_spare: {
          name: "MCCB 160A Spare",
          status: 35300,
          power: 35340,
          amp: 35331,
          kwh: 35300,
        },
      },
    },

    htGroups: {
      lesco: {
        name: "LESCO Incoming",
        status: 29000,
        power: 29040,
        amp: 29031,
        kwh: 29000,
      },
      kgl: {
        name: "KGL Incoming",
        status: 29100,
        power: 29140,
        amp: 29131,
        kwh: 29100,
      },
      outgoing: {
        name: "Outgoing / Transformer Protection Panel",
        status: 29200,
        power: 29240,
        amp: 29231,
        kwh: 29200,
      },
      main: {
        name: "Main Incoming (LT)",
        status: 29300,
        power: 29340,
        amp: 29331,
        kwh: 29300,
      },
    },
  },
};

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isValidInstance = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const extractAllInstances = (data = BacNetData) => {
  const instances = {};

  const traverse = (node, division, path = []) => {
    if (!isObject(node)) return;

    const meterKey = path[path.length - 1] ?? "";

    const isMeter = ["status", "power", "amp", "kwh"].some((key) =>
      isValidInstance(node[key]),
    );

    if (isMeter && meterKey) {
      const sectionIndex = path.findIndex(
        (key) => key === "departments" || key === "htGroups",
      );

      const department =
        sectionIndex !== -1 ? (path[sectionIndex + 1] ?? "") : "";

      instances[division].data[meterKey] = {
        division,
        department,
        meter_key: meterKey,
        meter_name: node.name ?? meterKey,
        status: node.status ?? null,
        power: node.power ?? null,
        amp: node.amp ?? null,
        kwh: node.kwh ?? null,
        scale: node.scale ?? 1,
      };

      return;
    }

    Object.entries(node).forEach(([key, value]) => {
      if (isObject(value)) {
        traverse(value, division, [...path, key]);
      }
    });
  };

  Object.entries(data ?? {}).forEach(([division, divisionObject]) => {
    if (!isObject(divisionObject)) return;

    const divisionKey = division.trim().toLowerCase();

    instances[divisionKey] = { data: {} };

    ["departments", "htGroups"].forEach((section) => {
      const sectionData = divisionObject[section];

      if (isObject(sectionData)) {
        traverse(sectionData, divisionKey, [section]);
      }
    });
  });

  return instances;
};

// Build the static meter index once instead of traversing all
// configuration data on every helper call.
const ALL_INSTANCES = extractAllInstances(BacNetData);

const FORMATTED_DIVISION_DATA = Object.fromEntries(
  Object.entries(ALL_INSTANCES).map(([division, value]) => [
    division,
    Object.values(value.data ?? {}),
  ]),
);

// Get meter records for one division or all divisions.
export const divisionData = (division, data = BacNetData) => {
  const formattedData =
    data === BacNetData
      ? FORMATTED_DIVISION_DATA
      : Object.fromEntries(
          Object.entries(extractAllInstances(data)).map(
            ([divisionName, value]) => [
              divisionName,
              Object.values(value.data ?? {}),
            ],
          ),
        );

  if (typeof division === "string" && division.trim()) {
    const divisionKey = division.trim().toLowerCase();
    return formattedData[divisionKey] ?? [];
  }

  return formattedData;
};

// Get a specific field or complete meter records for each division.
export const getSpecificValue = (key, division, data = BacNetData) => {
  const meters = divisionData(undefined, data);

  const filteredMeters =
    typeof division === "string" && division.trim()
      ? {
          [division.trim().toLowerCase()]:
            meters[division.trim().toLowerCase()] ?? [],
        }
      : meters;

  return Object.fromEntries(
    Object.entries(filteredMeters).map(([divisionName, items]) => [
      divisionName,
      items.map((item) => {
        if (!key) return item;
        return item[key] ?? null;
      }),
    ]),
  );
};

export { extractAllInstances };
