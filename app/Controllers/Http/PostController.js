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
