# Nexus Prisma Examples: Finances app

### Quick start

Install packages:

`yarn install`

Generate Photon client: 

`yarn generate`

Start server:

`yarn dev`

### Example API calls

```
{
  users {
    name
    accounts {
      name
      balance(currency: EUR)
      currency
      transactions {
        amount
      }
    }
  }
}
```

Sign up / sign in:

```
mutation signUp {
  signUp(email: "serg@example.com" password: "serg@example.com") {
    idToken
    user {
      id	
			email
    }
  }
}

mutation signIn {
  signIn(email: "serg@example.com" password: "serg@example.com") {
    idToken
    user {
      id
      email
    }
  }
}
```

Currenty authentificated user:

```
{
  me {
    id
  }
}
```

Create a transaction:

```
mutation createTransaction {
  createTransaction(data:{
    account: { connect: { id: 1 } }
    amount: 1
  }) {
    id
    account {
      balance
    }
  }
}
```