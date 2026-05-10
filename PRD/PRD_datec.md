# PRD Datec — Integração Hardware com MES

**Parceiro:** [Datec Solution](https://www.datecsolution.com/pt/)
**Versão:** 1.0
**Data:** 10/05/2026
**Base:** PRD_geral.md, PRD_infra.md

![Datec Solution](https://www.datecsolution.com/img/datec-solution.webp)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Escopo de Responsabilidade da Datec](#2-escopo-de-responsabilidade-da-datec)
3. [Equipamentos Monitorados](#3-equipamentos-monitorados)
4. [Gateway Industrial](#4-gateway-industrial)
5. [Dados Coletados por Tipo de Equipamento](#5-dados-coletados-por-tipo-de-equipamento)
6. [Arquitetura de Integração](#6-arquitetura-de-integração)
7. [Protocolo de Comunicação](#7-protocolo-de-comunicação)
8. [Interface com o MES](#8-interface-com-o-mes)
9. [Requisitos Não-Funcionais](#9-requisitos-não-funcionais)
10. [Critérios de Aceite](#10-critérios-de-aceite)

---

## 1. Visão Geral

### 1.1 Objetivo

Definir o escopo de hardware, infraestrutura elétrica e integração fornecidos pela **Datec Solution** para conectar os equipamentos do chão de fábrica da Amafil diretamente ao sistema MES, eliminando a coleta manual de dados de produção nas linhas.

### 1.2 Papel da Datec

A Datec é o parceiro responsável pela camada física de automação e conectividade. Sua entrega cobre tudo entre o equipamento produtivo e a interface de rede da fábrica — o MES recebe os dados já tratados via API do gateway.

### 1.3 Benefícios esperados

| Benefício | Descrição |
|---|---|
| Coleta automática | Contagens e status capturados diretamente do equipamento, sem digitação |
| Tempo real | Dados disponíveis no MES com latência máxima de 5 segundos |
| Rastreabilidade | Cada evento vinculado à OP, turno, máquina e operador ativo no MES |
| Redução de perdas | Desvios de produção identificados automaticamente via alertas |
| Histórico confiável | Dados de máquina auditáveis e não editáveis pelo operador |

---

## 2. Escopo de Responsabilidade da Datec

### 2.1 Fornecimento e instalação

| Item | Descrição |
|---|---|
| **Suportes** | Estruturas metálicas para fixação dos painéis e dispositivos na linha |
| **Painéis elétricos** | Painéis de controle com proteções, CLP/PLC e fonte de alimentação |
| **Clausuras** | Caixas de proteção IP65+ para componentes expostos ao ambiente fabril |
| **Instalação em linha** | Cabeamento, conexão nos equipamentos e comissionamento |
| **Gateway industrial** | Dispositivo de borda responsável por coletar, processar e transmitir os dados |

### 2.2 Fora do escopo da Datec

- Desenvolvimento do sistema MES (responsabilidade da equipe de TI / Amafil)
- Infraestrutura de rede da fábrica (switches, Wi-Fi, cabeamento de rede)
- Integração com ERP Protheus (responsabilidade do MES)
- Treinamento de operadores no uso do MES

---

## 3. Equipamentos Monitorados

Cada equipamento recebe sensores e/ou conexão direta via protocolo industrial. O gateway consolida os sinais de todos os equipamentos da linha.

| Tipo | Equipamento | Variáveis principais |
|---|---|---|
| **Embaladora** | Máquina de embalagem de produtos | Ciclos por minuto, contagem de unidades embaladas, status (rodando/parada), alarmes |
| **Enfardadeira** | Formação e fechamento de fardos | Contagem de fardos, peso por fardo (se integrado à balança), tempo de ciclo, falhas |
| **Costuradeira** | Fechamento de sacaria por costura | Ciclos, estado do fio/agulha, contagem de sacos fechados, paradas por quebra |
| **Coladeira** | Fechamento de embalagem por cola | Temperatura da cola, ciclos, contagem de caixas fechadas, falhas de aplicação |
| **Balança dosadora** | Pesagem e dosagem de produto | Peso por ciclo, desvio da tara, contagem de dosagens, alarmes de faixa de peso |

---

## 4. Gateway Industrial

### 4.1 Função

O gateway é o dispositivo central da solução Datec. Ele:

- Conecta-se fisicamente a cada equipamento da linha (via CLP, sensor ou protocolo digital)
- Processa e normaliza os sinais de cada equipamento
- Armazena buffer local em caso de queda de rede
- Envia os dados ao MES via HTTP/REST sobre a rede local da fábrica

### 4.2 Características técnicas (referência)

| Característica | Especificação |
|---|---|
| Protocolos industriais suportados | Modbus RTU, Modbus TCP, OPC-UA, pulso seco |
| Conectividade | Ethernet RJ45 (rede local da fábrica) |
| Armazenamento local | Buffer mínimo de 24h em caso de queda de rede |
| Alimentação | 24 VDC via painel elétrico Datec |
| Proteção | IP54 mínimo (dentro da clausura) |
| Sincronização de horário | NTP via rede local |

### 4.3 Identificação do gateway

Cada gateway é identificado por um `gateway_id` único cadastrado no MES. Um gateway pode gerenciar um ou mais equipamentos da mesma linha.

---

## 5. Dados Coletados por Tipo de Equipamento

### 5.1 Embaladora

```json
{
  "equipment_type": "embaladora",
  "equipment_id": "EMB-01",
  "timestamp": "2026-05-10T14:32:00Z",
  "cycle_count": 1452,
  "units_per_minute": 24,
  "status": "running",
  "alarm_code": null
}
```

### 5.2 Enfardadeira

```json
{
  "equipment_type": "enfardadeira",
  "equipment_id": "ENF-01",
  "timestamp": "2026-05-10T14:32:00Z",
  "bale_count": 87,
  "bale_weight_kg": 25.3,
  "cycle_time_s": 42,
  "status": "running",
  "alarm_code": null
}
```

### 5.3 Costuradeira

```json
{
  "equipment_type": "costuradeira",
  "equipment_id": "COS-01",
  "timestamp": "2026-05-10T14:32:00Z",
  "bag_count": 1448,
  "status": "running",
  "thread_alarm": false,
  "alarm_code": null
}
```

### 5.4 Coladeira

```json
{
  "equipment_type": "coladeira",
  "equipment_id": "COL-01",
  "timestamp": "2026-05-10T14:32:00Z",
  "box_count": 360,
  "glue_temp_c": 175.2,
  "status": "running",
  "temp_alarm": false,
  "alarm_code": null
}
```

### 5.5 Balança Dosadora

```json
{
  "equipment_type": "balança_dosadora",
  "equipment_id": "BAL-01",
  "timestamp": "2026-05-10T14:32:00Z",
  "dose_count": 1452,
  "last_weight_kg": 1.002,
  "tare_deviation_g": 2.1,
  "status": "running",
  "weight_alarm": false
}
```

---

## 6. Arquitetura de Integração

```
┌───────────────────────────────────────────────────────────────┐
│                     LINHA DE PRODUÇÃO                          │
│                                                               │
│  [Embaladora]  [Enfardadeira]  [Costuradeira]                 │
│  [Coladeira]   [Balança Dosadora]                             │
│       │               │               │                       │
│       └───────────────┴───────────────┘                       │
│                       │  (Modbus / OPC-UA / pulso)            │
│              ┌────────▼────────┐                              │
│              │  Gateway Datec  │  ← Painel elétrico Datec     │
│              │  (dispositivo   │    Suporte + Clausura         │
│              │   de borda)     │                              │
│              └────────┬────────┘                              │
└───────────────────────┼───────────────────────────────────────┘
                        │ HTTP/REST (rede local da fábrica)
┌───────────────────────▼───────────────────────────────────────┐
│                   MES — Backend Fastify                        │
│                                                               │
│   POST /api/gateway/events                                    │
│                                                               │
│   - Valida gateway_id                                         │
│   - Vincula evento à OP ativa na máquina                      │
│   - Persiste no PostgreSQL                                    │
│   - Publica via Supabase Realtime → Dashboard                 │
└───────────────────────────────────────────────────────────────┘
```

---

## 7. Protocolo de Comunicação

### 7.1 Envio de eventos

O gateway envia eventos ao MES periodicamente e em cada mudança de estado relevante.

**Endpoint:** `POST /api/gateway/events`
**Autenticação:** API Key fixa por gateway (header `X-Gateway-Key`)
**Formato:** JSON (application/json)
**Frequência:** A cada 5 segundos (heartbeat) + evento imediato em alarme ou parada

### 7.2 Payload padrão do gateway

```json
{
  "gateway_id": "GW-LINHA-01",
  "company_id": "amafil",
  "sent_at": "2026-05-10T14:32:00Z",
  "events": [
    {
      "equipment_id": "EMB-01",
      "equipment_type": "embaladora",
      "timestamp": "2026-05-10T14:32:00Z",
      "data": { }
    }
  ]
}
```

### 7.3 Resposta do MES

```json
{
  "received": true,
  "active_op": {
    "op_id": "OP-2026-00423",
    "product": "Farinha de Trigo 1kg",
    "target_qty": 5000
  }
}
```

### 7.4 Comportamento offline

- Se o gateway não conseguir alcançar o MES, armazena eventos no buffer local
- Ao reconectar, envia o backlog na ordem cronológica
- O MES aceita eventos fora de ordem e os persiste com o `timestamp` original do gateway

---

## 8. Interface com o MES

### 8.1 Vínculo OP × Máquina × Gateway

O MES mantém o cadastro de qual máquina está vinculada a qual gateway. Ao receber um evento, o sistema:

1. Identifica o `equipment_id`
2. Busca a OP ativa para aquele equipamento no turno atual
3. Acumula as contagens no registro de apontamento da OP
4. Dispara alertas se houver alarme ou desvio de produção

### 8.2 Dados disponíveis no MES após integração

| Dado | Origem | Uso |
|---|---|---|
| Contagem de peças / sacos / fardos | Gateway | Apontamento automático da OP |
| Velocidade de produção (upm/cpm) | Gateway | Indicador de performance (OEE) |
| Status do equipamento | Gateway | Registro automático de paradas |
| Alarmes ativos | Gateway | Notificação para Manutenção |
| Peso por dosagem | Gateway (balança) | Controle de conformidade de peso |

### 8.3 Apontamento automático vs. manual

- O MES usa os dados do gateway como **fonte primária** de contagem
- O operador pode **corrigir** valores no MES quando houver justificativa (ex: rejeição manual)
- O dado original do gateway é preservado para auditoria, mesmo após correção

### 8.4 Dashboard em tempo real

Os eventos do gateway são publicados via **Supabase Realtime**, alimentando o dashboard de produção com:

- Contador ao vivo por equipamento
- Status (rodando / parado / alarme)
- Gráfico de produção acumulada no turno
- Alertas de alarme com timestamp e código

---

## 9. Requisitos Não-Funcionais

| Requisito | Meta |
|---|---|
| Latência gateway → MES | ≤ 5 segundos em condições normais de rede |
| Disponibilidade do gateway | 99,5% no horário de produção |
| Buffer offline | Mínimo 24 horas de eventos armazenados localmente |
| Segurança | Comunicação restrita à rede interna; API Key por gateway |
| Proteção física | IP54 mínimo para todos os componentes Datec |
| Sincronização de tempo | NTP; desvio máximo de 2 segundos em relação ao servidor MES |

---

## 10. Critérios de Aceite

### 10.1 Aceite de hardware (Datec)

- [ ] Painel elétrico instalado e energizado em cada linha
- [ ] Todos os equipamentos conectados ao gateway (com sinal confirmado)
- [ ] Gateway transmitindo eventos ao endpoint do MES com sucesso
- [ ] Teste de buffer offline: desconectar rede por 1 hora e validar reenvio dos eventos

### 10.2 Aceite de integração (MES)

- [ ] Eventos recebidos persistidos no banco com `equipment_id`, `timestamp` e dados corretos
- [ ] OP ativa sendo vinculada automaticamente ao evento recebido
- [ ] Dashboard atualizado em ≤ 5 segundos após evento do gateway
- [ ] Alarme do gateway gerando notificação no MES para o perfil Manutenção
- [ ] Apontamento automático acumulando corretamente a contagem por turno

---

*Documento gerado em 10/05/2026. Revisão conjunta Amafil + Datec necessária antes da assinatura do contrato.*
