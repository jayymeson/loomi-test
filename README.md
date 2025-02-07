## 🏦 Microsserviços Bancários  

Este repositório contém a implementação de um **sistema bancário inovador**, projetado com **arquitetura baseada em microsserviços** para garantir modularidade e comunicação eficiente entre os serviços.  

## 📌 Contexto  
O projeto faz parte de um **desafio técnico** que envolve o desenvolvimento de dois microsserviços independentes, mas interconectados, para simular operações bancárias essenciais:  

### 🚀 Microsserviço de Transferências  
- Gerencia transações financeiras entre clientes.  
- Implementa regras de negócio para validação e processamento seguro das transferências.  
- Garante a consistência e a rastreabilidade das operações.  

### 👤 Microsserviço de Clientes  
- Responsável pelo gerenciamento de informações de clientes.  
- Armazena e fornece acesso seguro a dados bancários, como contas e saldo disponível.  
- Permite consultas e atualizações de informações cadastrais.  

## ⚙️ Tecnologias Utilizadas  
- **Linguagem:** Node.js  
- **Framework:** Nest.js  
- **Banco de Dados:** PostgreSQL  
- **Mensageria:** RabbitMQ  
- **Autenticação e Segurança:** JWT  
- **Comunicação entre Microsserviços:** REST  
- **Containerização:** Docker  

---

## 📌 **Instalação**  

### Clonar o Repositório  

```bash
git clone https://github.com/jayymeson/loomi-test.git
cd loomi-test
```

---

## 🚀 **Uso**  

### **Rodar a Aplicação Localmente com Docker Compose**  

1. Suba os contêineres com o Docker Compose:  

```bash
docker-compose up --build
```

Este comando irá construir as imagens Docker e iniciar os contêineres.

2. Verifique se os contêineres estão rodando:  

```bash
docker ps
```

3. **Acesse os serviços nos endpoints abaixo:**  

| Serviço        | URL de Acesso |
|---------------|--------------|
| **API Gateway** | `http://18.188.38.96:3002` |
| **Customers** | `http://18.188.38.96:3001` |
| **Transactions** | `http://18.188.38.96:3000` |
| **RabbitMQ Management UI** | `http://18.188.38.96:15672` (Usuário: `guest`, Senha: `guest`) |

4. **Conectar ao banco de dados via DBeaver**  

- **Host:** `172.31.11.250`  
- **Banco Transactions:**  
  - **User:** `transactions_user`  
  - **Senha:** `transactions_password`  
  - **DB Name:** `transactions_db`  
  - **Porta:** `5432`  

- **Banco Customers:**  
  - **User:** `customers_user`  
  - **Senha:** `customers_password`  
  - **DB Name:** `customers_db`  
  - **Porta:** `5432`  

5. **Aplicar as migrations:**  

```bash
# Transactions
docker exec -it transactions npx prisma migrate dev --name init --schema=prisma/schema.prisma

# Customers
docker exec -it customers npx prisma migrate dev --name init --schema=prisma/schema.prisma
```

---

## 👨‍💻 **Contribuição**  

1. Fork o repositório.  
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`).  
3. Commit suas mudanças (`git commit -am 'Adicionar nova feature'`).  
4. Push para a branch (`git push origin feature/nome-da-feature`).  
5. Abra um Pull Request.  

---

## 📝 **Licença**  

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.  
