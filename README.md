# QueryBuilder
Build SQL Query with javascipt for node.js user

Usage
=
Select query
```javascript
new QueryBuilder().select(['table.a', 'table.b']).generate('table')
// or
new QueryBuilder().select(['table.a', 'table.b']).from('table').generate()
// ------ result ------
// SELECT  `table`.`a`, `table`.`b` FROM `table`;
// ------ result ------
```
Select Sum, min, avg, max
```javascript
new QueryBuilder()
        .selectMin({
            'min1': 'tb1.min'
        })
        .selectMax({
            'max': 'tb1.max'
        })
        .selectAvg({
            'avg': 'tb1.avg'
        })
        .selectSum({
            'sum': 'tb1.sum',
            'sum2': 'tb2.sum'
        })
        .generate('tb1')
// ------ result ------
// SELECT  MIN(`tb1`.`min`) AS `min1`, MAX(`tb1`.`max`) AS `max`, AVG(`tb1`.`avg`) AS `avg`,
//         SUM(`tb1`.`sum`) AS `sum`, SUM(`tb2`.`sum`) AS `sum2` FROM `tb1`;
// ------ result ------
    
```
DISTINCT select 
```javascript
new QueryBuilder()
        .select([
            't.1', 't.2'
        ])
        .distinct()
        .generate('t')
// ------ result ------
// SELECT DISTINCT `t`.`1`, `t`.`2`
// FROM `t`;
// ------ result ------
```
Select LIKE, NOT LIKE
```javascript
new QueryBuilder()
        .select(['test.asd', 'test.2'])
        .like({
            colName: 'target',
            percentSignPos: 'left',
            searchTarget: 'leftTarget'
        })
        .like({
            colName: 'target',
            percentSignPos: 'right',
            searchTarget: 'rightTarget'
        })
        .notLike({
            colName: 'target',
            percentSignPos: 'both',
            searchTarget: 'bothTarget'
        })
        .generate('test')
// ------ result ------
// SELECT  `test`.`asd`, `test`.`2`
// FROM `test`
// WHERE `target` LIKE '%leftTarget' ESCAPE '!' AND `target` LIKE 'rightTarget%' ESCAPE '!' AND `target`
// NOT LIKE '%bothTarget%' ESCAPE '!';
// ------ result ------
```
Select orderBy where, orWhere, groupBy, having, orHaving, limit
```javascript
    new QueryBuilder()
        .select([
            't1.asdf', 't1.te'
        ])
        .where({
            '=': ['t1.id', 't1.test'],
            '<': ['t1.count', 'COUNT(*)']
        })
        .orWhere({
            '=': ['t1.as', 't1.asdf']
        })
        .orderBy({
            'desc' : ['t1.id', 't1.test'],
            'asc': 't2.asdfasdf'
        })
        .groupBy(['t1.id', 't1.asdf'])
        .having({
            '<' : ['COUNT(tb.1)', 'COUNT(tb.2)']
        })
        .orHaving({
            '=' : ['COUNT(tb.orTarget1)', 'COUNT(tb.orTarget2)'],
            '<' : ['COUNT(tb.target)', 'COUNT(tb.orHavingTest)']
        })
        .limit(3, 5)
        .generate('t1')
// ------ result ------
// SELECT  `t1`.`asdf`, `t1`.`te`
// FROM `t1`
// WHERE `t1`.`id` = `t1`.`test` AND `t1`.`count` < COUNT(*) OR `t1`.`as` = `t1`.`asdf`
// GROUP BY `t1`.`id`, `t1`.`asdf`
// HAVING COUNT(`tb`.`1`) < COUNT(`tb`.`2`) OR COUNT(`tb`.`orTarget1`) = COUNT(`tb`.`orTarget2`) OR COUNT(`tb`.`target`) < COUNT(`tb`.`orHavingTest`)
// ORDER BY `t1`.`id`, `t1`.`test` DESC `t2`.`asdfasdf` ASC;
// LIMIT 3, 5;
// ------ result ------
```

Join query(join type express)
```javascript
// Support join type
// 'LEFT', 'RIGHT', 'OUTER', 'INNER', 'LEFT OUTER', 'RIGHT OUTER'
// join type expressed
new QueryBuilder()
    .select([
        't1.asdf', 't1.te'
    ])
    .where({
        '=': ['t1.id', 't1.test'],
        '<': ['t1.count', 'COUNT(*)']
    })

    .join({
        cond: 't1.t = t.1',
        tableName: 'tb1',
        alias: 'asdf',
        type: 'left'
    })
    .orderBy({
        'desc' : ['t1.id', 't1.test'],
        'asc': 't2.asdfasdf'
    })
    .groupBy(['t1.id', 't1.asdf'])
    .having({
        '<' : ['COUNT(tb.1)', 'COUNT(tb.2)']
    })
    .orHaving({
        '=' : ['tb.orTarget1', 'COUNT(tb.orTarget2)'],
        '<' : ['COUNT(tb.target)', 'COUNT(tb.orHavingTest)']
    })
    .generate('t1')
// ------ result ------
// SELECT  `t1`.`asdf`, `t1`.`te`
// FROM `t1`
// LEFT JOIN `tb1` ON t1.t = t.1 AS `asdf`
// WHERE `t1`.`id` = `t1`.`test` AND `t1`.`count` < COUNT(*)
// GROUP BY `t1`.`id`, `t1`.`asdf`
// HAVING COUNT(`tb`.`1`) < COUNT(`tb`.`2`) OR `tb`.`orTarget1` = COUNT(`tb`.`orTarget2`) OR COUNT(`tb`.`target`) < COUNT(`tb`.`orHavingTest`)
// ORDER BY `t1`.`id`, `t1`.`test` DESC `t2`.`asdfasdf` ASC;
// ------ result ------
```
Join query(join type non express)
```javascript
// join type un expressed
new QueryBuilder()
    .select([
        't1.asdf', 't1.te'
    ])
    .where({
        '=': ['t1.id', 't1.test'],
        '<': ['t1.count', 'COUNT(*)']
    })
    .join({
        cond: 't1.t = t.1',
        tableName: 'tb1',
        alias: 'asdf',
        // type: 'left'
    })
    .orderBy({
        'desc' : ['t1.id', 't1.test'],
        'asc': 't2.asdfasdf'
    })
    .groupBy(['t1.id', 't1.asdf'])
    .having({
        '<' : ['COUNT(tb.1)', 'COUNT(tb.2)']
    })
    .orHaving({
        '=' : ['tb.orTarget1', 'COUNT(tb.orTarget2)'],
        '<' : ['COUNT(tb.target)', 'COUNT(tb.orHavingTest)']
    })
    .generate('t1')

// ------ result ------
// SELECT  `t1`.`asdf`, `t1`.`te`
// FROM `t1`
// JOIN `tb1` ON t1.t = t.1 AS `asdf`
// WHERE `t1`.`id` = `t1`.`test` AND `t1`.`count` < COUNT(*)
// GROUP BY `t1`.`id`, `t1`.`asdf`
// HAVING COUNT(`tb`.`1`) < COUNT(`tb`.`2`) OR `tb`.`orTarget1` = COUNT(`tb`.`orTarget2`) OR COUNT(`tb`.`target`) < COUNT(`tb`.`orHavingTest`)
// ORDER BY `t1`.`id`, `t1`.`test` DESC `t2`.`asdfasdf` ASC;
// ------ result ------
```

Select where in, where not in
```javascript
new QueryBuilder()
        .select(['t1.df', 't1.asdf'])
        .whereIn('searchTarget', [
            'tag1', 'tag2'
        ])
        .where({
            '=': ['t1.asdf', 't1.df']
        })
        .whereNotIn('notSearch', [
            'not1', 'not2', 'not3'
        ])
        .generate('t1')

// SELECT  `t1`.`df`, `t1`.`asdf`
// FROM `t1`
// WHERE `searchTarget` IN (`tag1`, `tag2`) AND `t1`.`asdf` = `t1`.`df` AND `notSearch` NOT IN (`not1`, `not2`, `not3`);
```


<h2>Change Log</h2>

>><h4>Version 1.0.0.0</h5>
>>1. Init QueryBuilder<br />


## License

This project is licensed MIT licenses:
* [MIT](LICENSE-MIT)

---


<h2>Contact : osh12201@gmail.com</h2>