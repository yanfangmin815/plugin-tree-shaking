const { statisticsTimes, vars }  = require('./utils')

const chokidar = require('chokidar');

const { parse } = require('@babel/parser');

const fs = require('fs');

const path = require('path');

const traverse = require("@babel/traverse").default;

const generator = require('@babel/generator').default; // https://www.babeljs.cn/docs/6.26.3/babel-types

const t = require('babel-types');

const _ = require('lodash');

const generateCatchClause = () => {
  // param-2
  const identifier3 = t.identifier('err')
  const identifier1 = t.identifier('console')
  const identifier2 = t.identifier('log')
  const memberExpression = t.memberExpression(identifier1, identifier2)
  /**
   * operator: "+" | "-" | "/" | "%" | "*" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=" (required)
   * left: Expression (required)
   * right: Expression (required)
   */
  const StringLiteral = t.stringLiteral('err is:')
  const identifier = t.identifier('err')
  const binaryExpression = t.binaryExpression('+',StringLiteral, identifier)
  /**
   * callee: required
   * arguments: required
   */
  const callExpression = t.callExpression(memberExpression, [binaryExpression])
  const expressionStatement = t.expressionStatement(callExpression)

  const blockStatement = t.blockStatement([expressionStatement])
  const catchClause = t.catchClause(identifier3, blockStatement) // param-2
  return catchClause
}

const generateBlockStatement2 = () => {
   // param-3
   const identifier = t.identifier('console')
   const identifier1 = t.identifier('log')
   const memberExpression = t.memberExpression(identifier, identifier1)
  
   const StringLiteral = t.stringLiteral('exec finally')
   /**
    * callee: required
    * arguments: required
    */
   const callExpression = t.callExpression(memberExpression, [StringLiteral])
   const expressionStatement = t.expressionStatement(callExpression)
   const blockStatement = t.blockStatement([expressionStatement])

   return blockStatement
}

/**
 * generateTryStatement:??????????????????try...catch???????????????
 */
const generateTryStatement = ({body=[]}) => {
  const nodeBody = t.blockStatement(body)
  const catchClause = generateCatchClause()
  const blockStatement = generateBlockStatement2()
  /**
   * block: BlockStatement (required)
   * handler: CatchClause (default: null)
   * finalizer: BlockStatement (default: null)
   */
  const tryStatement = t.tryStatement(nodeBody, catchClause, blockStatement)
  return tryStatement
}


class TreeShaking {
  constructor(options = {}) {
    if (!_.isObject(options)) {
      console.log("\x1b[31m Warning: \x1b[0m  \x1b[35m auto-add-try-catch's options should be a object \x1b[0m ");
      options = {dir:['src']};
    } else if (options.dir && !(_.isArray(options.dir) || _.isString(options.dir))) {
      options.dir = ['src'];
      console.log("\x1b[31m Warning: \x1b[0m  \x1b[35m auto-add-try-catch's dir options should be a array  \x1b[0m ");
    } else if (options.ignored && !_.isRegExp(options.ignored)) {
      options.ignored = null;
      console.log("\x1b[31m Warning: \x1b[0m  \x1b[35m auto-add-try-catch's ignored options should be a regexp  \x1b[0m ");
    }

    this.options = options;
    this.isWatching = false; // ??????watch??????

    this.watcher = null;
    this.compileHasError = false;
    this.pattern = ['.js']
  }

  getFile(paths) {
    const _this = this;
    paths.map((item, index) => {
      const path1 = _this.getReolve(item)
      fs.stat(path1, (firsterr, firstData) => {
        // ????????????????????????
        const isDirectory1 = firstData && firstData.isDirectory()
        switch(isDirectory1){
          case true: 
            fs.readdir(path1, (err, data) => {
              if (err) throw err;
              // ????????????????????????
              for (let i = 0; i < data.length; i++) {
                let path2 = _this.getReolve(item + '/' + data[i])
                fs.stat(path2, function(err, stats) {
                  const isDirectory = stats.isDirectory()
                  if (isDirectory) {
                    fs.readdir(path2, (suberr, subdata) => {
                      let datas = subdata.map((items, indexes) => {
                        return items = item + '/' + data[i] + '/' + items
                      })
                      _this.getFile(datas)
                    })
                  } else {
                    // const path = item + '/' + data[i]
                    const extname = _this.getExtname(path2)
                    if (_this.pattern.includes(extname)) {
                      const ast = _this.getAst(path2);
                      _this.handleTraverse(ast, path2)
                    }
                  }
                });
              }
            });
            break;
          case false:
            const extname = _this.getExtname(path1)
            if (_this.pattern.includes(extname)) {
              const ast = _this.getAst(path1);
              _this.handleTraverse(ast, path1)
            }
            break;
          default:
            console.log('\x1b[34m ???????????????????????????????????????????????? \x1b[0m');
        }
      })
    })
  }

  getExtname(filePath){
    // The path.extname() method returns the extension of the path
    // path.extname('index.html');
    // Returns: '.html'
    return path.extname(filePath)
  }

  getReolve(filePath) {
    // return absolute path
    return path.resolve(filePath)
  }

  init(stats) {
    // ????????????js??????
    const { pattern, dir } = this.options
    this.pattern = pattern && pattern.length && pattern || this.pattern
    this.getFile(dir)
    this.compileHasError = stats.hasErrors();

    if (this.isWatching && !this.watcher && !this.compileHasError) {
      // https://www.npmjs.com/package/chokidar
      this.watcher = chokidar.watch(dir, {
        usePolling: true,
        ignored: this.options.ignored
      });
      this.watcher.on('change', _.debounce(this.handleChange.bind(this)(), 0))
        .on('unlink', _.debounce(this.handleChange.bind(this)(true), 0));
    }
  }

  // ?????????????????? ????????????????????????
  handleChange() {
    return (pathname, stats) => {
      const filePath = this.getReolve(pathname)
      const ast = this.getAst(filePath)
      this.handleTraverse(ast, filePath)
    }
 }

handleTraverse(ast='', filePath='') {
    let importVars = []
    let allVars = []
    let nameArr = []
    let exportSpecifierArr = []
    let _this = this
    traverse(ast, {
      Program: {
        enter(body) {},
        exit() {
          importVars.length && importVars.map(item => {
            if(!vars.includes(item.name) && statisticsTimes(nameArr, item.name) == 1) item.path.remove()
          })
          exportSpecifierArr.length && exportSpecifierArr.map(item => {
            if(statisticsTimes(nameArr, item.name) == 1) { 
              item.path.remove && item.path.remove() 
            }
          })
          _this.handleAst(ast, filePath)
        }
      },
      ImportSpecifier(path) {
        importVars.push({path, name: path.node.imported.name})
      },
      Identifier(path) {
        // ??????????????????????????? ?????????????????????????????????
        const obj = {
          start: path.node.start,
          end: path.node.end,
          name: path.node.name
        }
        let canPush = false
        allVars.map(item => {
          if(item.start == obj.start || item.end == obj.end) { canPush = true }
        })
        !canPush && allVars.push(obj)
        nameArr = allVars.map(item => item.name)
      },
      FunctionDeclaration(path) {
        exportSpecifierArr.push({path, name: path.node.id.name})
      },
      VariableDeclarator(path) {
        exportSpecifierArr.push({path, name: path.node.id.name})
      }
    })
  }

  getAst(filename) {
    const content = fs.readFileSync(filename, 'utf8');

    try {
      const ast = parse(content, {
        sourceType: 'module'
      }); // get ast tree

      return ast;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  autoWriteFileSync(ast='', filePath='') {
      const config = {
        quotes: 'single', 
        retainLines: false, 
        compact: false,
        concise: false
      }
      // ??????????????????
      const output = generator(ast, config);
      fs.writeFileSync(filePath, output.code);
  }

  handleAst(ast, filePath, allVars) {
    let _this = this
    traverse(ast, {
      Program: {
        exit() {
          _this.autoWriteFileSync(ast, filePath)
        }
      }
    })
  }

  watchClose() {
    if (this.watcher) {
      this.watcher.close();
    }
  } 

  // ?????????????????? apply
  apply(compiler) {
    const init = this.init.bind(this);
    const watchClose = this.watchClose.bind(this);

    if (compiler.hooks) {
      compiler.hooks.watchRun.tap('TreeShaking', () => {
        this.isWatching = true;
      });
      compiler.hooks.done.tap('TreeShaking', init);
      compiler.hooks.watchClose.tap('TreeShaking', watchClose);
    } else {
      compiler.plugin('watchRun', () => {
        this.isWatching = true;
      });
      compiler.plugin('done', init);
      compiler.plugin('watchClose', watchClose);
    }
  }
}

module.exports = TreeShaking;