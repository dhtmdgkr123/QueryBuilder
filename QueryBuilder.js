module.exports.QueryBuilder = (function() {
    /**
     * @todo  : add gropstart, group end
     */

    let cacheVal = tmp = {
        limit: {
            val: 0,
            offset: 0,
            isCall: false,
        },
        selectArray: [],
        orderArray: [],
        joinArray: [],
        fromArray: [],
        whereArray: [],
        groupArray: [],
        havingArray: [],
        isDistinct: false,
    };
    
    let isSubquery = false;
    function QueryBuilder(isSub) {
        isSubquery = isSub;
    }
    
    ////////////////////////////////////////// util ////////////////////////////
    
    const getRawType = (data) => Object.prototype.toString.call(data).slice(8, -1).toLowerCase();
    const isArray = (data) => getRawType(data) === 'array';
    const isString = (data) => getRawType(data) === 'string';
    const isNumeric = (data)  => !isNaN(parseFloat(data)) && isFinite(data);

    const isSelect = (val) => ['select', 'from'].some(i => i === val.toLowerCase());
    const getFirstCommand = (val) => val.split('(').filter(i => i !== '')[0].split(' ')[0];
    const escape = (data) => {
        const addBacktick = (val) => `\`${val}\``;
        const checkDot = (val) => val.indexOf('.') !== -1;
        let rlt = '';
        let splitByBraket = null;
        let splitData = splitByBraket;
        if ( !isNumeric(data) ) {
            if (data.indexOf('(') !== -1) {
                // 함수 사용 또는 subquery
                if (isSelect(getFirstCommand(data)) || data.indexOf('*') !== -1) {
                    rlt = data;
                } else if (checkDot(data)) {
                    splitData = data.split('.');
                    splitByBraket = splitData[0].split('(');
                    rlt = `${splitByBraket[0]}(${addBacktick(splitByBraket[1])}.${addBacktick(splitData[1].split(')')[0])})`; // 
                }  else {
                    splitData = data.split('(');
                    
                    rlt = `${splitData[0]}(${addBacktick(splitData[1].split(')')[0])})`;
                }
            } else if (checkDot(data)) {
                if ( data.indexOf(',') !== -1 ) {
                    let tmp;
                    splitData = data.split(',');
                    rlt = splitData.map(i => {
                        tmp = i.trim().split('.');
                        return `${addBacktick(tmp[0])}.${addBacktick(tmp[1])}`
                    }).join(', ');
                    tmp = null;
                } else {
                    splitData = data.split('.');
                    rlt = `${addBacktick(splitData[0])}.${addBacktick(splitData[1])}`;
                }
            } else {
                rlt = addBacktick(data);
            }
            
            if (data.indexOf(' ') !== -1) {
                splitData = data.split(' ');
                if (splitData[1].toLowerCase() === 'as') {
                    rlt = `${rlt} AS ${addBacktick(splitData[2])}`;
                }
            }
            rlt = rlt.trim();
        } else {
            rlt = data;
        }
        return rlt;
    }
    
    const commaToArray = (data) => isString(data) ? data.split(',').map(i => i.trim()) : data;
    const hasComma = (data) => data.indexOf(',') !== -1;
    const handleData = (data) => hasComma(data) ? commaToArray(data) : [data];
    const _pushData = (arr, data) => {
        if ( isString(data) ) {
            arr.push(data);
        } else {
            for (const i in data) {
                arr.push(data[i]);
            }
        }
    };

    const flatArray = (data) => {
        const rev = (arr) => {
            const rlt = [];
            for (let i = arr.length - 1; i >= 0; i--) {
                rlt.push(arr[i]);
            }
            return rlt;
        }
        if (isArray(data)) {
            let next = null;
            const stack = data
            const rlt = [];
            while (stack.length) {
                next = stack.pop();
                if (isArray(next)) {
                    for (const i in next) {
                        stack.push(next[i]);
                    }
                } else {
                    rlt.push(next);
                }
            }
            next = null;
            return rev(rlt);
        }
    };
    const isQuery = (val) => isString(val) && val.indexOf('(') !== -1 && isSelect(getFirstCommand(val));
    ////////////////////////////////////////// util ////////////////////////////



    const _select = (selectData) => {
        _pushData(cacheVal.selectArray, handleData(selectData));
    }

    const _where = (whereData, cond = 'AND') => {
        const checkOperator = ['AND', 'OR'].some(i => i === cond);
        const _pushObject = (arr, obj) => {
            if (checkOperator) {
                for (const key in obj) {
                    if ( isString(obj[key]) ) {
                        arr.push([obj[key]]);
                    } else {
                        arr.push([escape(obj[key][0]), key, escape(obj[key][1])]);
                    }
                }
            } else {
                arr.push([`${escape(whereData)} = ${escape(cond)}`]);
            }
        };
        
        let tempArr = []
        let str = '';
        _pushObject(tempArr, whereData);
        if (cacheVal.whereArray.length) {
            str = `${checkOperator ? cond : ''} ${tempArr.map(i => i.join(' ')).join(` ${cond} `)}`;
        } else {
            str = `${tempArr.map(i => i.join(' ')).join(` ${cond} `)}`;
        }
        _pushData(cacheVal.whereArray, str.trim());
        
    }


    const _optionSelect = (selectObj = {}, opt = null) => {
        const objToArr = (obj) => {
            const arr = [];
            for (const key in obj) {
                arr.push([key, obj[key]]);
            }
            return arr;
        };

        if ( ! selectObj ) {
            return console.error('input select target');
        } else {
            _pushData(cacheVal.selectArray, objToArr(selectObj).map(i => `${opt}(${i[1]}) AS ${i[0]}`));
        }
    }

    const _orderBy = (target) => {
        if ( ! target ) {
            return console.error('input target or sort order!');
        } else {
            for (const key in target) {
                _pushData(cacheVal.orderArray, target[key] ? [[
                    isArray(target[key]) ? target[key].map(i => escape(i)).join(', ') :  escape(target[key]), key.toUpperCase()
                ]] : [[key.toUpperCase()]]);
            }
        }
    }


    const _limit = (val, offset) => {
        cacheVal.limit.val = val ? val : cacheVal.limit.val;
        cacheVal.limit.offset = offset ? offset : cacheVal.limit.offset;
        cacheVal.limit.isCall = true;
    }

    const _join = (joinArr) => {
        cacheVal.joinArray.push(joinArr);
        const getJoinQuery = ({cond, type, tableName, alias}) => {
            
            const getJoinType = (t) => {
                if (t) {
                    t = t.toUpperCase().trim();
                    if ( ['LEFT', 'RIGHT', 'OUTER', 'INNER', 'LEFT OUTER', 'RIGHT OUTER'].some(i => i === t) ) {
                        t = `${t} `;
                    } else {
                        t = '';
                    }
                } else {
                    t = '';
                }
                return t;
            }
            return `${getJoinType(type)}JOIN ${escape(tableName)} ON ${cond} AS ${escape(alias)}`;
        }
        cacheVal.joinArray.push(getJoinQuery(cacheVal.joinArray.pop()));
    }
    
    const _whereIn = (searchTarget, targetList, isNot = false) => {
        let rlt;
        if (isQuery(targetList)) {
            rlt = `IN ${targetList}`;
        } else {
            rlt = `IN (${targetList.filter(i => i !== '').map(i => isNumeric(i) ? i : escape(i)).join(', ')})`;
        }
        rlt = `${cacheVal.whereArray.length ? 'AND ' : ''}${escape(searchTarget)} ${isNot ? 'NOT ' : ''}${rlt}`;
        _pushData(cacheVal.whereArray, rlt);
    }
    
    const _like = (colName, searchTarget, percentSignPos, isNot = false) => {
        const addApostrophe = val => isString(val) ? `'${val}'` : val;
        const addPercent = val => `${percentSignPos === 'both' || percentSignPos === 'left' ? '%' : ''}${val}${percentSignPos === 'both' || percentSignPos === 'right' ? '%' : ''}`;
        let rlt = `${isQuery(colName) ? colName : escape(colName)}${isNot ? ' NOT ' : ' '}LIKE `;
        rlt = `${rlt}${addApostrophe(addPercent(searchTarget))} ESCAPE '!'`;
        _pushData(cacheVal.whereArray, cacheVal.whereArray.length ? `AND ${rlt}` : `${rlt}`);
    }

    const _groupBy = (arr) => {
        _pushData(cacheVal.groupArray,
            arr.filter(i => i !== '')
               .map(i => isNumeric(i) ? i : escape(i.trim()))
        );
    }

    const _having = (havingData, cond = 'AND') => {
        const checkOperator = ['AND', 'OR'].some(i => i === cond);
        const _pushObject = (arr, obj) => {
            if (checkOperator) {
                for (const key in obj) {
                    if ( isString(obj[key]) ) {
                        arr.push([obj[key]]);
                    } else {
                        
                        arr.push( [ escape(obj[key][0]), key, escape(obj[key][1]) ] );
                    }
                }
            } else {
                arr.push([`${escape(havingData)} = ${escape(cond)}`]);
            }
        };
        
        let tempArr = []
        let str = '';
        _pushObject(tempArr, havingData);
        if (cacheVal.havingArray.length) {
            str = `${checkOperator ? cond : ''} ${tempArr.map(i => i.join(' ')).join(` ${cond} `)}`;
        } else {
            str = `${tempArr.map(i => i.join(' ')).join(` ${cond} `)}`;
        }
        _pushData(cacheVal.havingArray, str.trim());
    }

    const compile = {
        _select: (isDistinct, data) => `SELECT${isDistinct ? ' DISTINCT' : ''} ${flatArray(data).map(i => escape(i)).join(', ')}\n`,
        _from: (from) => `FROM ${from.map(i => escape(i)).join(', ')}\n`,
        _where: (where) => `WHERE ${where.join(' ')}\n`,
        _orderBy: (orderBy) => `ORDER BY ${orderBy.map(i => i.join(' ')).join(' ')}\n`,
        _limit: (lVal, lOffset) => `LIMIT ${lVal}${lOffset ? `, ${lOffset}` : ''}\n`,
        _join: (joinArr) => `${joinArr.join('\n')}\n`,
        _groupBy: (groupArr) => `GROUP BY ${groupArr.join(', ')}\n`,
        _having: (havingArr) => `HAVING ${havingArr.join(' ')}\n`,
        _final: (query) => `${isSubquery ? '(' : ''}${query.trim()}${isSubquery ? '' : ';'}${isSubquery ? ')' : ''}`
    };
    
    ////////////////////////////////////////// select //////////////////////////////////////////
    QueryBuilder.prototype.selectMin = function(selectData = {}) {
        _optionSelect(selectData, 'MIN');
        return this;
    }
    QueryBuilder.prototype.selectMax = function(selectData = {}) {
        _optionSelect(selectData, 'MAX');
        return this;
    }
    QueryBuilder.prototype.selectAvg = function(selectData = {}) {
        _optionSelect(selectData, 'AVG');
        return this;
    }
    QueryBuilder.prototype.selectSum = function(selectData = {}) {
        _optionSelect(selectData, 'SUM');
        return this;
    }
    QueryBuilder.prototype.select = function(selectData = '*') {
        _select(selectData);
        return this;
    }
    QueryBuilder.prototype.distinct = function() {
        cacheVal.isDistinct = true;
        return this;
    }
    ////////////////////////////////////////// select //////////////////////////////////////////

    QueryBuilder.prototype.from = function(fromData) {
        _pushData(cacheVal.fromArray, handleData(fromData));
        return this;
    };
    
    QueryBuilder.prototype.limit = function(val, offset = 0) {
        _limit(val, offset);
        return this;
    }
    
    ////////////////////////////////////////// where //////////////////////////////////////////
    QueryBuilder.prototype.andWhere = function(cond = {}) {
        _where(cond, 'AND');
        return this;
    }
    QueryBuilder.prototype.orWhere = function(cond = {}) {
        _where(cond, 'OR');
        return this;
    }
    QueryBuilder.prototype.where = function(leftCond, rightCond) {
        _where(leftCond, rightCond);
        return this;
    }

    QueryBuilder.prototype.whereIn = function(searchTarget, targetList) {
        _whereIn(searchTarget, targetList, false);
        return this;
    }
    QueryBuilder.prototype.whereNotIn = function(searchTarget, targetList) {
        _whereIn(searchTarget, targetList, true);
        return this;
    }
    QueryBuilder.prototype.like = function({colName, searchTarget, percentSignPos = 'both'}) {
        _like(colName, searchTarget, percentSignPos, false);
        return this;
    }
    QueryBuilder.prototype.notLike = function({colName, searchTarget, percentSignPos = 'both'}) {
        _like(colName, searchTarget, percentSignPos, true);
        return this;
    }
    ////////////////////////////////////////// where //////////////////////////////////////////

    ////////////////////////////////////////// order by //////////////////////////////////////////
    QueryBuilder.prototype.orderBy = function(sortObj) {
        _orderBy(sortObj);
        return this;
    }
    ////////////////////////////////////////// order by //////////////////////////////////////////


    ////////////////////////////////////////// Join //////////////////////////////////////////
    QueryBuilder.prototype.join = function(joinObj) {
        _join(joinObj);
        return this;
    }
    ////////////////////////////////////////// join //////////////////////////////////////////

    ////////////////////////////////////////// groupBy //////////////////////////////////////////
    QueryBuilder.prototype.groupBy = function(groupArr = []) {
        _groupBy(groupArr);
        return this;
    }
    QueryBuilder.prototype.having = function(havingObj) {
        _having(havingObj, 'AND');
        return this;
    }
    QueryBuilder.prototype.orHaving = function(havingObj) {
        _having(havingObj, 'OR');
        return this;
    }
    ////////////////////////////////////////// groupBy //////////////////////////////////////////

    
    QueryBuilder.prototype.generate = function(tableName = null) {
        if (tableName) {
            this.from(tableName);
        }

        let finalQuery = compile._select(cacheVal.isDistinct, cacheVal.selectArray);
        
        if ( cacheVal.fromArray.length ) {
            finalQuery = `${finalQuery}${compile._from(cacheVal.fromArray)}`;
        }
        
        if (cacheVal.joinArray.length) {
            finalQuery = `${finalQuery}${compile._join(cacheVal.joinArray)}`;
        }

        if (cacheVal.whereArray.length) {
            finalQuery = `${finalQuery}${compile._where(cacheVal.whereArray)}`;
        }

        if (cacheVal.groupArray.length) {
            finalQuery = `${finalQuery}${compile._groupBy(cacheVal.groupArray)}`;
        }
        
        if (cacheVal.havingArray.length) {
            finalQuery = `${finalQuery}${compile._having(cacheVal.havingArray)}`
        }
        
        if (cacheVal.orderArray.length) {
            finalQuery = `${finalQuery}${compile._orderBy(cacheVal.orderArray)}`
        }

        if (cacheVal.limit.isCall) {
            finalQuery = `${finalQuery}${compile._limit(cacheVal.limit.val, cacheVal.limit.offset)}`;
        }
        cacheVal = tmp;
        return compile._final(finalQuery);
    }
    return QueryBuilder;
})();ㅌㅈ