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

}

module.exports = PostController
