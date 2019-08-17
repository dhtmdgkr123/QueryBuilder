const q = require('./QueryBuilder');
console.log(
    new q.QueryBuilder().select('test').generate('tableName')
)