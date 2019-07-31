'use strict'

const Factory = use('Factory');
const {test, trait} = use('Test/Suite')('Posts')

trait('Test/ApiClient')
trait('Auth/Client')


test('can create post', async ({assert, client}) => {

  const user = await Factory.model('App/Models/User').create()

  const data = {
    title: 'Test title',
    description: 'Test body'
  };

  const response = await client.post('/posts')
    .loginVia(user, 'jwt')
    .send(data).end()

  response.assertStatus(200);
  response.assertJSONSubset({
    title: data.title,
    description: data.description,
    user_id: user.id,
  })
})

test('can list posts', async ({assert, client}) => {

  const user = await Factory.model('App/Models/User').create()
  const post = await Factory.model('App/Models/Post').make()

  await user.posts().save(post)
  const response = await client.get('/posts').end()


  response.assertStatus(200);

  response.assertJSONSubset(
    [{
      title: post.title,
      description : post.description,
      user_id: user.id,
    }]
  )

})

