# Sistema de Chamados

API REST em camadas (Entity → Repository → DTO → Exception → Service → Controller) com front-end estático.
Java 21, Spring Boot 4.1.1, Maven, JPA, H2, Bean Validation.

## Como rodar

```
.\mvnw spring-boot:run
```

Perfis:

| Perfil | Uso |
|---|---|
| (padrão) | H2 em memória, sem dados |
| `demo` | H2 em memória com dados de exemplo: `.\mvnw spring-boot:run "-Dspring-boot.run.profiles=demo"` |
| `postgres` | PostgreSQL via variáveis `DB_URL`, `DB_USER`, `DB_PASSWORD` |

Documentação interativa: http://localhost:8080/swagger-ui.html
Front-end: http://localhost:8080/

## Testes

```
.\mvnw test
```

- `repository/*`: `@DataJpaTest` (Cliente, Categoria, Tecnico, Chamado)
- `controller/*`: `@WebMvcTest` com `@MockitoBean` no service (Cliente, Categoria, Tecnico, Chamado, Comentario, Dashboard)

## Rotas

| Recurso | Rotas |
|---|---|
| Clientes | `GET/POST /clientes`, `GET/PUT/DELETE /clientes/{id}`, `GET /clientes/{id}/chamados` |
| Categorias | `GET/POST /categorias`, `GET/PUT/DELETE /categorias/{id}` |
| Técnicos | `GET/POST /tecnicos`, `GET/PUT/DELETE /tecnicos/{id}` |
| Chamados | `GET/POST /chamados`, `GET/PUT/DELETE /chamados/{id}`, `PATCH /chamados/{id}/atribuir`, `PATCH /chamados/{id}/status` |
| Comentários | `GET/POST /chamados/{id}/comentarios` |
| Dashboard | `GET /dashboard` |

`GET /chamados` aceita `status`, `prioridade`, `clienteId`, `page`, `size`, `sort` (padrão: `size=10`, `sort=dataAbertura,desc`).

## Regras de negócio

Transições de status:

- ABERTO → EM_ATENDIMENTO ou FECHADO
- EM_ATENDIMENTO → AGUARDANDO_CLIENTE ou FECHADO
- AGUARDANDO_CLIENTE → EM_ATENDIMENTO ou FECHADO
- FECHADO → nenhuma

Chamado fechado não pode ser alterado nem receber técnico (comentários ainda são permitidos). `dataFechamento` é preenchida ao fechar.

## Erros

Formato: `{ "momento", "status", "erro", "detalhes" }`

| Código | Quando |
|---|---|
| 400 | Validação falhou |
| 404 | Recurso não encontrado |
| 409 | Regra de negócio ou violação de integridade (e-mail/nome duplicado, exclusão de registro em uso) |

## Exemplo (PowerShell)

```
'{"nome":"Ana Souza","email":"ana@exemplo.com","telefone":"47999999999"}' | Set-Content $env:TEMP\cliente.json
curl.exe -i -X POST http://localhost:8080/clientes -H "Content-Type: application/json" -d "@$env:TEMP\cliente.json"
curl.exe http://localhost:8080/clientes
```

## Front-end

Em `src/main/resources/static`: HTML + CSS + JavaScript (módulos ES), sem build. Rotas por hash (`#/chamados`, `#/clientes/1`…) para não colidir com as rotas REST.

Telas: dashboard, chamados (lista com filtros e paginação, abertura/edição, detalhe com trilha de status, atribuição de técnico, comentários), clientes (com seus chamados), categorias e técnicos.

O front está integrado ao back (`USAR_MOCK = false` em `js/api.js`). Para voltar aos dados simulados, mude para `true`.
