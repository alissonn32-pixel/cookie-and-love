# Cookie & Love — Design do Site de E-commerce

**Data:** 2026-06-10
**Status:** Aprovado para planejamento de implementação

## 1. Visão Geral

**Cookie & Love** é um site de e-commerce para uma marca de cookies artesanais estilo
Nova York (cookies grandes, recheados, crocantes por fora e macios por dentro).

O projeto é um **clone funcional** do site de referência [jcookies.vercel.app](https://jcookies.vercel.app/),
reaproveitando sua arquitetura de funcionalidades (cardápio, carrinho, pedido via
WhatsApp, painel administrativo com Supabase), mas com identidade visual própria.

### Fluxo principal
1. Cliente acessa o site e navega pelo cardápio (abas de categorias)
2. Adiciona itens ao carrinho
3. Revisa o pedido e preenche dados de contato/entrega/pagamento
4. O pedido é formatado e enviado via WhatsApp para a loja
5. A loja gerencia pedidos, produtos, estoque e avaliações pelo painel admin

## 2. Identidade Visual — "NYC Artisan" (versão clara)

Direção aprovada após comparação com o site de referência (que usa visual genérico
de "app de delivery": fonte de sistema, cards brancos planos, badges verde clichê).

- **Tipografia**: Fraunces (serifada, display/itálico para destaques) + Space Mono
  (mono, para preços, labels e UI)
- **Paleta**: tons quentes — creme/off-white de fundo (`#faf3e8`), marrom escuro para
  texto/CTAs (`#2a1c12`), caramelo/dourado como cor de destaque (`#c8783c`), bege claro
  para bordas (`#e3cdb6`)
- **Elementos de marca**:
  - Faixa "deli stripe" (listras diagonais caramelo/creme) no topo
  - Selo "Est. New York Style — Cookies Artesanais"
  - Hero com frase de efeito ("Crocante por fora, derretendo por dentro.")
  - Cards de produto foto-forward (imagem grande, badges "Novo"/"Mais vendido"/"Esgotado")
  - Botões de ação em alto contraste (marrom escuro sobre creme)

## 3. Estrutura de Páginas

### Página pública (`/`) — single page

- **Header**: logo "Cookie & Love", link Instagram, status "Aberto agora" + nota,
  selo "Est. New York Style"
- **Info bar**: tempo de preparo, retirada/entrega, pedido mínimo
- **Hero**: frase de efeito da marca
- **Abas de navegação** (mantidas como na referência):
  - Destaques
  - Cookies
  - Especiais da casa
  - Avaliações
  - Informações
- **Grid de produtos**: foto, nome, descrição curta, preço, botão adicionar (+/-),
  badge opcional
- **Carrinho** (sticky bar): itens, quantidades, total, botão "Revisar pedido"
- **Checkout** (modal/etapa): nome, horário desejado, WhatsApp, retirada ou entrega,
  forma de pagamento (Pix/dinheiro/cartão), observações → gera mensagem formatada e
  abre `wa.me` com o pedido

### Painel admin (`/admin`)

- Login via Supabase Auth (e-mail/senha, usuário único)
- Dashboard: últimos 50 pedidos
- CRUD de produtos (nome, descrição, preço, foto, categoria/aba, badge, estoque do dia)
- Gestão de avaliações (aprovar/editar/remover)
- Configurações da loja: status (aberto/fechado), horário, tempo de preparo, pedido
  mínimo, formas de pagamento, textos do hero/abas, número de WhatsApp de destino,
  opções de entrega/retirada

## 4. Modelo de Dados (Supabase / Postgres)

### `products`
| campo | tipo | descrição |
|---|---|---|
| id | uuid | PK |
| name | text | nome do produto |
| description | text | descrição curta |
| price | numeric | preço |
| image_url | text | foto (Supabase Storage) |
| category | enum | `destaque` \| `cookie` \| `especial` |
| badge | enum/null | `novo` \| `mais_vendido` \| null |
| stock_today | int/null | null = ilimitado; 0 = esgotado |
| active | bool | visível no cardápio |

### `orders`
| campo | tipo | descrição |
|---|---|---|
| id | uuid | PK |
| customer_name | text | |
| whatsapp | text | |
| pickup_time | text | horário desejado |
| delivery_type | enum | `retirada` \| `entrega` |
| payment_method | enum | `pix` \| `dinheiro` \| `cartao` |
| notes | text/null | observações |
| items | jsonb | `[{product_id, name, qty, price}]` |
| total | numeric | |
| created_at | timestamptz | |

### `reviews`
| campo | tipo | descrição |
|---|---|---|
| id | uuid | PK |
| customer_name | text | |
| rating | int | 1-5 |
| comment | text | |
| approved | bool | exibido no site se true |
| created_at | timestamptz | |

### `store_settings` (linha única)
| campo | tipo | descrição |
|---|---|---|
| is_open | bool | |
| prep_time_minutes | int | |
| min_order_value | numeric | |
| hero_text | text | |
| tabs_config | jsonb | textos/ordem das abas |
| payment_methods | jsonb | métodos habilitados |
| whatsapp_target | text | número que recebe pedidos |
| delivery_options | jsonb | retirada/entrega habilitados |

**Auth**: Supabase Auth (e-mail/senha), usuário único administrador, rota `/admin`
protegida por middleware do Next.js.

## 5. Stack Técnica

- **Next.js (App Router) + TypeScript + Tailwind CSS** — paleta e tipografia "NYC
  Artisan" configuradas em `tailwind.config`
- **Supabase**: Postgres (tabelas acima), Auth (admin), Storage (fotos dos produtos)
- **Deploy**: Vercel
- **Carrinho**: estado local (localStorage), sem tabela própria

O plano de implementação incluirá os passos de criação de conta gratuita no Supabase,
criação do projeto, configuração de variáveis de ambiente, e deploy na Vercel (o
usuário ainda não possui essas contas).

## 6. Casos de Borda e Validações

- **Estoque esgotado**: produto visível mas com botão de adicionar desabilitado
  (`stock_today = 0`)
- **Loja fechada** (`is_open = false`): cardápio continua visível; checkout exibe
  aviso "Loja fechada no momento" e desabilita finalização
- **Pedido mínimo**: se total do carrinho < `min_order_value`, botão de finalizar
  fica desabilitado com aviso do valor faltante
- **Carrinho vazio**: mensagem amigável no lugar da barra de carrinho
- **Mensagem WhatsApp**: gerada via `wa.me` com `encodeURIComponent`, contendo itens,
  total e dados do cliente; número de destino configurável no admin
- **LGPD**: texto de privacidade fixo na aba "Informações" — coleta apenas nome,
  WhatsApp e dados do pedido, sem compartilhamento com terceiros

## 7. Conteúdo Inicial (placeholder)

- Cardápio inicial com produtos de exemplo nomeados com pegada nova-iorquina (ex:
  "Big Apple Choc Chunk", "Brooklyn Red Velvet"), editáveis depois pelo admin
- Localização/entrega: configuração genérica/placeholder, ajustável depois pelo admin
- Avaliações: placeholder editável

## 8. Testes

- Testes unitários (Vitest): cálculo do total do carrinho, geração da mensagem do
  WhatsApp, validação de pedido mínimo / loja fechada
- Testes de integração leves para CRUD do admin (mock do client Supabase)
- Verificação manual no navegador: fluxo completo (cardápio → carrinho → checkout →
  link do WhatsApp) e painel admin
