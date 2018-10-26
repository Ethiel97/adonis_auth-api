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
