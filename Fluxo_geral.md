---
config:
  theme: redux
  layout: fixed
---
flowchart BT

 subgraph s_protheus["ERP Externo"]
  n_protheus["TOTVS Protheus\n(SIGAPCP)"]
 end

 subgraph s_linha["Linha de Produção"]
  n_maquinas["Máquinas\n(Empacotadora · Ensacadeira\nCosturadeira · Coladeira)"]
  n_balanca["Balança / Dosagem"]
  n_enfard["Enfardadeira"]
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

 n_maquinas --> n_gw
 n_balanca  --> n_gw
 n_enfard   --> n_gw
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
