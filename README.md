# Overview
Buyer app has the following CRUD fuunctionalities on database (mongoDB):
- Register (create) user
- Register (create) shopping items
- Login
- Logout
- Read items/user profile
- Update items/user profile
- Delete items/user

# API documentation
https://documenter.getpostman.com/view/12689164/TVYGbxDZ

# Use case
If a registered user goes out for shopping, the API endpoint /users/me/shopping?on=true is called. 
This endpoint obtains a list of users whose addresses are nearby (within 5km), and also filter out any users with no items in their shopping list.
Then it sends off email notifications to the neighbors and the shopper telling what to buy. 
