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
    balance
    accounts {
      name
      balance
      transactions {
        amount
      }
    }
  }
}
```
