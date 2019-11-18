const Thread = require('../src/models/threads-model');
const User = require('../src/models/users-model');
const assert = require('assert');

describe("Thread tests", () => {
    let username = "Lars123";
   let user;
   let thread;
   let thread_id;

   beforeEach((done) => {
       user = new User({
           name: username,
           password: "test1234"
       });

       user.save()
           .then(() => User.findOne({name: username}))
           .then((u) => {
               user = u;
               thread = new Thread({
                   title: "Test Thread",
                   content: "Content of this test thread!",
                   author: u
               });

               thread.save()
                   .then(() => Thread.find({}))
                   .then((t) => {
                       thread_id = t[0]._id;
                       done();
                   });
           });
   });

   it('Creates a new Thread', (done) => {
       const newThread = new Thread({
           title: 'Second test thread',
           content: 'Some exciting stuff',
           author: user
       });

       newThread.save()
           .then(() => Thread.findOne({title: 'Second test thread'}))
           .then((t) => {
               assert(t.content === 'Some exciting stuff');
               done();
           });

   });

   it("Gets all the threads", (done) => {
       Thread.find({})
           .then((threads) => {
               assert(threads.length > 0);
               done();
           });
   });

   it("Get thread by id", (done) => {
       Thread.findOne({_id: thread_id})
           .then((t) => {
               assert(t.title === "Test Thread");
               done();
           });
   });

   it("Updates thread by id", (done) => {
      Thread.findOneAndUpdate({_id: thread_id}, {title: "Updated the first thread"})
          .then(() => Thread.findOne({_id: thread_id}))
          .then((t) => {
              assert(t.title === "Updated the first thread");
              done();
          });
   });

   it("Upvotes a thread by id", (done) => {
      Thread.findOneAndUpdate({_id: thread_id}, {$inc: {upVotes: 1}})
          .then(() => Thread.findOne({_id: thread_id}))
          .then((t) => {
             assert(t.upVotes === 1);
             done();
          });
   });

   it("Downvotes a thread by id", (done) => {
       Thread.findOneAndUpdate({_id: thread_id}, {$inc: {downVotes: 1}})
           .then(() => Thread.findOne({_id: thread_id}))
           .then((t) => {
               assert(t.downVotes === 1);
               done();
           });
   });

   it("Deletes a thread by id", (done) => {
       Thread.findOneAndDelete({_id: thread_id})
           .then(() => Thread.findOne({_id: thread_id}))
           .then((t) => {
               assert(!t);
               done();
           })
   });
});
