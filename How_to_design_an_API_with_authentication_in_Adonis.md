# How to design an API with authentication in Adonis

## Introduction

Hey folks, have you ever been bothered with security issues with an API you worked on? Did you wonder how you can add authentication to your API. Well this tutorial will guide you in building a simple API, and show you how you can add authentication to it. Thanks to Adonis.js this can be handled easily for this awesome framework comes with JWT authentication out of the box. If you don't know what I mean by JWT, you can head over to [this link](https://jwt.io/introduction/) to grasp more info about it. Now it's time to jump into this tutorial. We'll build an API for a blog posts and so only authenticated users can perform some defined operations over posts.


## Prerequisites

In order to follow this tutorial, knowledge of JavaScript and Node.js is required. You should also have the following installed on your machine: 


- [Node.js(>=8.0.0)](https://nodejs.org)
- NPM(bundled with Node.js installer) or [Yarn](https://yarnpkg.com/)


## Set up the Adonis project

First open your terminal and type this command to install the Adonis CLI and create a new Adonis app:  


    # if you don't have Adonis CLI installed on your machine. 
      npm install -g @adonisjs/cli
      
    # Create a new adonis app and move into the app directory
    $ adonis new adonis_auth-api && cd adonis_auth-api

Now start the server and test if everything is working fine: 


    adonis serve --dev
    
    2018-09-23T12:25:30.326Z - info: serving app on http://127.0.0.1:3333
    

Open your browser and make a request to: http://127.0.0.1:3333. You should see the following:


![](https://d2mxuefqeaa7sj.cloudfront.net/s_4FBE6D9CA32FEB8DD0F2E1D93D2591A12B3FA0D18BBC59414E12217D0828C150_1537964205960_build-realtime-app-adonis-pusher-first-run.png)



## Set up the database and create the migration

Create a database.sqlite file in the database directory, and amend the .env file like this:


    DB_CONNECTION=sqlite
    DB_DATABASE=/absolute/path/to/database.sqlite
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=your_database_user
    DB_PASSWORD=your_dtabase_password

Open your terminal and run this command to generate our `Post` model as well as its corresponding controller and migration file which will be used to build the schema of our posts table: 


    adonis make:model Post -mc

Inside your post migration file copy and paste this code:


    //../database/migrations/*_.user.js
    'use strict'
    
    const Schema = use('Schema')
    
    class PostSchema extends Schema {
        up() {
            this.create('posts', (table) => {
                table.increments()
                table.string('title')
                table.string('description')
                table.integer('user_id').unsigned();
                table.foreign('user_id').references('Users.id').onDelete('cascade');
                table.timestamps()
            })
        }
    
        down() {
            this.drop('posts')
        }
    }
    
    module.exports = PostSchema
    

This code is pretty similar to what we are accustomed to in Laravel migration. You can see we defined our PostSchema table fields as: 

- title
- price
- description
- user_id

The `increments()`  will create an `id` field with `Auto Increment` and set it as `Primary key`. The `timestamps()` will create the `created_at` and `updated_at` fields respectively. We also set a foreign key on the `user_id` field to ensure that the user submitting post does exist.

Now if you run this command:  `adonis migration:run` in your terminal it will create the posts, and users (which migration is defined by default) tables in your database.
We need to define some relations on our models to make things easier for us to handle. Let's say a user can have one or many posts, and a single post belongs to a particular user. Let's translate that into code:

Add this function to your post model

    //../app/Models/Post.js
        user() {
            return this.belongsTo('App/Models/User');
        }

and this one to your user model

        //../app/Models/User.js
        posts() {
            return this.hasMany('App/Models/Post')
        }

This has been very simple to achieve :). We're done with that.


## Build our authentication workflow

Our users need to register and to get authenticated in order to perform any sensible operation on our data. When they register, our API will generate an authorization token which he can append to his future requests to manipulate our posts data. Basically we'll build a register and a login function, so we need to create our authentication controller.

First make this change in your  `auth.js`  file to tell our app to use `jwt` as our authenticator.


    //../config/auth.js
    authenticator: 'jwt',

Then head over to your terminal and type this command to create your controller:


    adonis make:controller --type http AuthController

The flag `--type` is to specify the type of controller we want to create, in our case it is an HTTP controller.
Now copy and paste this code inside your  `AuthController`  file.  


    //../app/Controllers/Http/AuthController.js
    
    'use strict'
    const User = use('App/Models/User');
    
    class AuthController {
    
      async register({request, auth, response}) {
    
        let user = await User.create(request.all())
    
        //generate token for user;
        let token = await auth.generate(user)
    
        Object.assign(user, token)
    
        return response.json(user)
      }
    
      async login({request, auth, response}) {
    
        let {email, password} = request.all();
    
        try {
          if (await auth.attempt(email, password)) {
            let user = await User.findBy('email', email)
            let token = await auth.generate(user)
    
            Object.assign(user, token)
            return response.json(user)
          }
    
    
        }
        catch (e) {
          console.log(e)
          return response.json({message: 'You are not registered!'})
        }
      }
      async getPosts({request, response}) {
        let posts = await Post.query().with('user').fetch()
    
        return response.json(posts)
      }
      
    }
    
    module.exports = AuthController

As expected we have our two functions. 
The `register` function creates a new user with the data sent in the request and generates an authorization token for that user, and returns the fresh created user as the response.

Our second function `login` checks first if the user information is valid, then it grasps all their data and also generate an authorization token for them, and returns the logged in user.

Note that the generated token will be appended to our future requests as I said above to help authenticate the user and help them perform the intended action on our data only if they are authenticated and recognized by our API system.

Now let's set up our routes. Go to your `routes.js`  file and paste the following code inside:


    //../start/routes.js
    const Route = use('Route')
    
    Route.post('/register', 'AuthController.register')
    Route.post('/login', 'AuthController.login')
    
    Route.put('/posts/:id', 'PostController.update').middleware('auth')
    Route.delete('posts/id', 'PostController.delete').middleware('auth')
    Route.post('/posts', 'PostController.store').middleware('auth')
    Route.get('/posts', 'PostController.getPosts');
    

Our two first routes are for authentication purposes, one for user registration and the other for the user signin. 
Then we define some routes our users can make requests to in order to manipulate our posts’ data as you can notice :). We add the `auth`  middleware to some our routes that require user authentication because the operation intended is quite sensible, and we need to ensure that the user is authorized by the system to perform that operation.


## Define our PostController

This controller will be responsible of handling requests over our posts’ data. In your terminal, type this command to create your controller:


    adonis make:controller --type http PostController

The `PostController` is now generated. It’s time to define its functions, open the file and paste the following block of code inside the body of your controller class:


    //../app/Controllers/Http/PostController.js
    'use strict'
    const Post = use('App/Models/Post');
    
    class PostController {
      async getPosts({request, response}) {
        let posts = await Post.query().with('user').fetch()
    
        return response.json(posts)
      }
    
      async create() {
      }
    
      async store({request, auth, response}) {
    
        try {
          // if (await auth.check()) {
          let post = await auth.user.posts().create(request.all())
          await post.load('user');
          return response.json(post)
          // }
    
        } catch (e) {
          console.log(e)
          return response.json({message: 'You are not authorized to perform this action'})
        }
    
      }
    
      async update({auth, params, response}) {
    
        let post = await Post.find(params.id)
        post.title = request.input('title')
        post.description = request.input('description');
    
        await post.save()
        await post.load('user');
    
        return response.json(post)
      }
    
      async delete({auth, params, response}) {
    
        await Post.find(params.id).delete()
    
        return response.json({message: 'Post has been deleted'})
      }
    
    }
    
    module.exports = PostController
    

Let’s explain those four functions defined above:

- `getPosts` fetches all posts from database and returns them as the response


- `store` pulls the requests data to create a new post, associates the current authenticated user as the author, and returs the fresh created post with its associated user.


- `update` updates a post by fetching its `id` with info pulled from the request’ object and returns it


- `delete` at last, finds a post by given its `id` and deletes from the data, then it returns a message.
## Test your API with Curl

Now let's test the API with Curl. If you don't have Postman, you can get it [here](https://www.getpostman.com/apps). No don't thank me, it's free 😉 .

First, you have disable the CSRF protection in order to send API requests without problem. Head over to the `shield.js` file, and make this change:


    //../config/shield.js
    ...,
    csrf: {
        enable: false,
       ...
      }
    } 

If you don’t know at all how to use Curl, head over to [this link](https://makandracards.com/makandra/1145-how-to-send-http-requests-using-curl) to get more insights, and then come back to the tutorial.

Say we want to get posts from our database, we type this  command inside our terminal: 
`curl -v localhost:3333/posts`. You will then get the list of posts from your database 🙂  as you can see on this screenshot.

![](https://d2mxuefqeaa7sj.cloudfront.net/s_9E366BCDD226C6BA0E2F10B4B6B1DF967F6CB2E4C6F3D0716F6C49BCFDAAB76C_1551706631668_Capture+dcran+574.png)


Note that if you didn’t submit any post yet you will get an empty array.


Now let’s try to register to the system, you can simply achieve with the following command:

    
    curl -d "email=yourEmail&username=yourUsername&password=yourPassword" -X POST localhost:3333/register
    

The response should be a user object containing your authentication token.

![](https://d2mxuefqeaa7sj.cloudfront.net/s_9E366BCDD226C6BA0E2F10B4B6B1DF967F6CB2E4C6F3D0716F6C49BCFDAAB76C_1551706964739_Capture+dcran+570.png)



After that if you want to login, you just have to grab your authentication token and append it to your request in this way:


    
    curl -d "email=yourEmail&password=yourPassword" -H "Authorization: Bearer ${YOUR_AUTH_TOKEN}" -X POST localhost:3333/login
    
![](https://d2mxuefqeaa7sj.cloudfront.net/s_9E366BCDD226C6BA0E2F10B4B6B1DF967F6CB2E4C6F3D0716F6C49BCFDAAB76C_1551707303208_Capture+dcran+571.png)


You can go further and test the other routes to play with this nice system you build on your own.
Try to submit a post request with the Curl tool and let’s see what you come up with.



## Conclusion 

Through this article you've learnt how you can build an API with authentication for your users. I hope this has been useful to you and will help you understand how you can integrate this kind of system into an existing application of yours. Feel free to get the source code of the project on [GitHub.](https://github.com/Ethiel97/adonis_auth-api)



