const driver = require('../services//neo4j').driver;
const session = driver.session();
const User = require('../models/users-model');

module.exports = {
  addFriendship(req, res) {
    const user = req.username;
    const friend = req.body.friendname;

    if (user === undefined || friend === undefined) {
      res.status(409).json({ error: "Username or friend's username missing!" });
    }

    // looking up the user if he/she exists in the mongo database
    User.findOne({ name: user }).then((result) => {
      // if the user was not found return status 404 with user not found message
      if (!result) {
        return res.status(404).json({ message: 'User was not found!' });
      }
      // else continue to look for the friend
      else {
        // looking up the friend if he/she exists in the mongo database
        User.findOne({ name: friend }).then((result) => {
          // if the user was not found return status 404 with user not found message
          if (!result) {
            return res.status(404).json({ message: 'Friend was not found!' });
          }
          // else continue to create friendship in neo4j database with session
          else {
            // checking in the neo4j db if this persons already exists
            session
              .run('MATCH (n:Person { name: $user }) return n', {user: user})
              .then(result => {
                // if person does not exist yet, create this person
                if (result.records.length === 0) {
                  session.run('CREATE (a:Person {name: $name}) RETURN a', {name: user});
                }
              })
              .then(() => {session.run('MATCH (n:Person { name: $friend }) return n', {friend: friend})
                  .then(result => {
                    // if person does not exist yet, create this person
                    if (result.records.length === 0) {
                      session.run('CREATE (a:Person {name: $name}) RETURN a', {
                        name: friend
                      });
                    }
                  })
                  .then(() => {
                    // checking if the friendship already exists
                    session.run('MATCH (:Person {name: $user})-[r: friendship]-(:Person {name: $friend}) return r',{ user: user, friend: friend })
                      .then(result => {
                        // if friendship does not exist yet, create a new friendship between user an friend
                        if (result.records.length === 0) {
                          session.run('MATCH (a:Person),(b:Person) ' + 'WHERE a.name = $user AND b.name = $friend ' + 'CREATE (a)-[r:friendship]->(b) ' + 'CREATE (b)-[:friendship]->(a) ',{ user: user, friend: friend })
                           .then(() => {
                              session.close();
                            })
                        }
                      });
                  });
                  // if everything went good then send a status 201 back for creating successfully a new friendship between user and friend
              }).then(() => {
                res.status(201).json({message: 'Created successfully a new friendship!'});
            });
          }
        });
      }
    });
  },
  deleteFriendship(req, res) {
    const friend = req.body.friendname;

    if (friend === undefined) {
      return res.status(409).json({message: 'friend was not found'})
    }

    // checking if friendship exists between user and friend, if so then delete their friendship
    session.run('MATCH (n { name: $friend }) DETACH DELETE n',{ friend: friend })
      .then(() => {
        // closing session 
        session.close()
      }).then(() => {
        res.status(200).json({message: 'Friendship successfully deleted!'});
      });
  }
}
