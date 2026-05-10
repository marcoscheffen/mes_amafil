---
config:
  theme: redux
  layout: fixed
---
flowchart BT

 subgraph s_linha["Linha de Produção"]
  n_maquinas["Máquinas\n(Empacotadora · Ensacadeira\nCosturadeira · Coladeira)"]
  n_balanca["Balança / Dosagem"]
  n_enfard["Enfardadeira"]
  n_gw["Gateway"]
 end

 subgraph s_dados["Camada de Dados"]
  n_db_off["BD Offline\n(local)"]
  n_db["BD Central"]
 end

 subgraph s_servidor["Servidor"]
  n_mes["MES"]
 end

 subgraph s_setores["Setores / Usuários"]
  n_pcp["PCP\n(cria Ordens de Produção)"]
  n_op["Operação\n(executa OPs · envia solicitações)"]
  n_manut["Manutenção"]
  n_almo["Almoxarifado"]
  n_gestao["Adm · TI · Master"]
 end

 subgraph s_disp["Dispositivos"]
  n_painel["Painel"]
  n_tablet["Tablet"]
  n_celular["Celular"]
 end

 n_maquinas --> n_gw
 n_balanca  --> n_gw
 n_enfard   --> n_gw
 n_gw       --> n_db_off
 n_db_off   --> n_db
 n_db      <--> n_mes

 n_mes <--> n_pcp
 n_mes <--> n_op
 n_mes <--> n_manut
 n_mes <--> n_almo
 n_mes <--> n_gestao

 n_op <-.solicitações.-> n_manut
 n_op <-.solicitações.-> n_almo

 n_painel  --> n_op
 n_tablet  --> n_op
 n_celular --> n_op
