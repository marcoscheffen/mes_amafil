---
config:
  theme: redux
  layout: fixed
---
flowchart LR

 subgraph s_protheus["ERP Externo"]
  n_protheus["TOTVS Protheus\n(SIGAPCP)"]
 end

 subgraph s_linha["Linha de Produção — 35 máquinas · 13 enfardadeiras"]

  subgraph s_diversos["Setor Diversos"]
   subgraph l01["L01 — Grãos"]
    m_01a["EMP-01A · MG1000\nINDUMAK"]
    m_01b["EMP-01B\nSAUTEC"]
    enf_e01a["ENF-E01A · MK30\nINDUMAK"]
   end
   subgraph l02["L02 — Pipoca"]
    m_02a["EMP-02A · MG1000\nINDUMAK"]
    enf_e02a["ENF-E02A · MK30\nINDUMAK"]
   end
   subgraph l09["L09 — Farofa"]
    m_09a["EMP-09A · MG1000\nINDUMAK"]
    m_09b["EMP-09B · MG1000\nINDUMAK"]
    enf_e09a["ENF-E09A · SE2500\nSAUTEC"]
    enf_e09b["ENF-E09B · SE2500\nSAUTEC"]
   end
   subgraph l10["L10 — Food Service"]
    m_10a["EMP-10A · MG8000\nINDUMAK"]
   end
   subgraph l11["L11 — Biju"]
    m_11a["EMP-11A · MM-5000\nINDUMAK"]
   end
   subgraph l12["L12 — Creme"]
    m_12a["EMP-12A · CB1000\nINDUMAK"]
   end
   subgraph l14["L14 — Pão de Queijo"]
    m_14a["EMP-14A · MG8000\nINDUMAK"]
    m_14b["EMP-14B · DG-4\nINDUMAK"]
    m_14c["EMP-14C · MG1000\nINDUMAK"]
    enf_e14a["ENF-E14A · SE5000\nSAUTEC"]
    enf_e14b["ENF-E14B · MK30\nINDUMAK"]
    enf_e14c["ENF-E14C · MK30\nINDUMAK"]
   end
   subgraph l15["L15 — Amid Mais"]
    ens_15_bica1["ENS-15-BICA1\n(Bica Manual)"]
    ens_15_bica2["ENS-15-BICA2\n(Bica Manual)"]
    ens_15_insack["ENS-15-INSACK\n(Aut. Estacionária)"]
    ens_15_ksp["ENS-15-KSP\nINDUMAK (Semi-aut.)"]
    ens_15_haver["ENS-15D-HAVER\n(Aut. Estacionária)"]
   end
   subgraph l28["L28 — Bolo"]
    m_28a["EMP-28A · SP-500\nSYSTEMPACK"]
   end
  end

  subgraph s_farinha["Setor Farinha"]
   subgraph l03["L03 — Farinha Pacote Papel"]
    col_03a["COL-03A · FE II\nEMBRAPAC"]
   end
   subgraph l04["L04 — Farinha Branca Plástico"]
    m_04a["EMP-04A · CG1000\nINDUMAK"]
    m_04b["EMP-04B · CG1000\nINDUMAK"]
    enf_e04["ENF-E04 · MK30\nINDUMAK"]
   end
   subgraph l05["L05 — Farinha Amarela Plástico"]
    m_05a["EMP-05A · MG1000\nINDUMAK"]
   end
   subgraph l06["L06 — Farinha Torrada Papel"]
    cos_06a["COS-06A · MF-3B\nMATISA"]
    cos_06b["COS-06B · MF-3B\nMATISA"]
   end
   subgraph l07["L07 — Farinha Torrada Plástico"]
    m_07a["EMP-07A · ERMD120\nINDUMAK"]
    m_07b["EMP-07B · ERMD120\nINDUMAK"]
    m_07c["EMP-07C · A120\nINDUMAK"]
    enf_e07["ENF-E07 · MK30\nINDUMAK"]
   end
   subgraph l29["L29 — Farinha Extra E70"]
    m_29_fl["EMP-29 · FORLINE3000\nDOSETEC (Semi-aut.)"]
    m_29a["EMP-29A · MG8000\nINDUMAK"]
    m_29b["EMP-29B · MG8000\nINDUMAK"]
    enf_e29a["ENF-E29A · MK40\nINDUMAK"]
    enf_e29b["ENF-E29B · MK40\nINDUMAK"]
   end
  end

  subgraph s_polvilho["Setor Polvilho"]
   subgraph l16["L16 — Polvilho Plástico"]
    m_16a["EMP-16A · FP1000\nINDUMAK"]
   end
   subgraph l17["L17 — Polvilho Plástico"]
    m_17a["EMP-17A · FP1000\nINDUMAK"]
    enf_e17["ENF-E17 · MK30\nINDUMAK"]
   end
   subgraph l18["L18 — Polvilho Papel"]
    col_18a["COL-18A · P5-2\nINDUMAK"]
    col_18b["COL-18B · FE10\nINDUMAK"]
    col_18c["COL-18C · FG-2\nINDUMAK"]
    m_18d["EMP-18D"]
   end
   subgraph l21["L21 — Polvilho Diversos Plástico"]
    m_21a["EMP-21A · MM-250\nINDUMAK"]
    m_21b["EMP-21B · MM-250\nINDUMAK"]
    enf_e21a["ENF-E21A · MK40\nINDUMAK"]
   end
   subgraph l22["L22 — Polvilho 25 kg"]
    ens_22b_bica1["ENS-22B-BICA1\n(Bica Manual)"]
    ens_22b_bica2["ENS-22B-BICA2\n(Bica Manual)"]
    ens_22a_ksp["ENS-22A · KSP\nINDUMAK (Semi-aut.)"]
    ens_22a_bica["ENS-22A-BICA\n(Bica Manual)"]
   end
   subgraph l33["L33 — Polvilho Diversos Plástico"]
    m_33a["EMP-33A · MR5000\nSAUTEC"]
   end
  end

  subgraph s_tapioca["Setor Massa Tapioca"]
   subgraph l30["L30 — Massa Tapioca Plástico"]
    m_30a["EMP-30A · MG1000\nINDUMAK"]
   end
  end

  n_balanca["Balança / Dosagem"]
  n_gw["Gateway IoT"]
 end

 subgraph s_dados["Camada de Dados"]
  n_db_off["BD Local\n(buffer gateway)"]
  n_db["PostgreSQL 16\n(BD Central)"]
  n_redis["Redis\n(BullMQ · Cache)"]
 end

 subgraph s_servidor["Servidor MES (On-Premises)"]
  n_nginx["Nginx\n(Proxy Reverso · TLS)"]
  n_api["API Node.js\n(Fastify · BullMQ)"]
  n_supabase["Supabase\n(Auth · Realtime · Storage)"]
 end

 subgraph s_setores["Perfis / Usuários"]
  n_pcp["PCP\n(libera OPs · dashboards)"]
  n_op["Operação\n(executa OPs · solicitações)"]
  n_manut["Manutenção"]
  n_almo["Almoxarifado"]
  n_gestao["Adm · TI · Master · Dev"]
 end

 subgraph s_disp["Dispositivos (PWA)"]
  n_painel["Painel"]
  n_tablet["Tablet"]
  n_celular["Celular"]
 end

 %% Setor Diversos → Gateway
 m_01a --> n_gw
 m_01b --> n_gw
 enf_e01a --> n_gw
 m_02a --> n_gw
 enf_e02a --> n_gw
 m_09a --> n_gw
 m_09b --> n_gw
 enf_e09a --> n_gw
 enf_e09b --> n_gw
 m_10a --> n_gw
 m_11a --> n_gw
 m_12a --> n_gw
 m_14a --> n_gw
 m_14b --> n_gw
 m_14c --> n_gw
 enf_e14a --> n_gw
 enf_e14b --> n_gw
 enf_e14c --> n_gw
 ens_15_bica1 --> n_gw
 ens_15_bica2 --> n_gw
 ens_15_insack --> n_gw
 ens_15_ksp --> n_gw
 ens_15_haver --> n_gw
 m_28a --> n_gw

 %% Setor Farinha → Gateway
 col_03a --> n_gw
 m_04a --> n_gw
 m_04b --> n_gw
 enf_e04 --> n_gw
 m_05a --> n_gw
 cos_06a --> n_gw
 cos_06b --> n_gw
 m_07a --> n_gw
 m_07b --> n_gw
 m_07c --> n_gw
 enf_e07 --> n_gw
 m_29_fl --> n_gw
 m_29a --> n_gw
 m_29b --> n_gw
 enf_e29a --> n_gw
 enf_e29b --> n_gw

 %% Setor Polvilho → Gateway
 m_16a --> n_gw
 m_17a --> n_gw
 enf_e17 --> n_gw
 col_18a --> n_gw
 col_18b --> n_gw
 col_18c --> n_gw
 m_18d --> n_gw
 m_21a --> n_gw
 m_21b --> n_gw
 enf_e21a --> n_gw
 ens_22b_bica1 --> n_gw
 ens_22b_bica2 --> n_gw
 ens_22a_ksp --> n_gw
 ens_22a_bica --> n_gw
 m_33a --> n_gw

 %% Setor Massa Tapioca → Gateway
 m_30a --> n_gw

 n_balanca  --> n_gw
 n_gw       --> n_db_off
 n_db_off   --> n_db
 n_db      <--> n_api
 n_db      <--> n_supabase
 n_redis   <--> n_api
 n_nginx    --> n_api
 n_nginx    --> n_supabase

 n_protheus --"OPs importadas"--> n_api
 n_api      --"apontamentos confirmados"--> n_protheus

 n_nginx   <--> n_pcp
 n_nginx   <--> n_op
 n_nginx   <--> n_manut
 n_nginx   <--> n_almo
 n_nginx   <--> n_gestao

 n_op <-.solicitações.-> n_manut
 n_op <-.solicitações.-> n_almo

 n_painel  --> n_op
 n_tablet  --> n_op
 n_celular --> n_op
