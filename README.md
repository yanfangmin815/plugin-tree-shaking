![](https://github.com/layne0625/auto-export-plugin/blob/master/screenshot/pic.gif)
## Introduction
- 文件改动或删除时，自动收集文件中的函数类语句，如果有改动且blockstatement无try...catch包裹，那么执行插件
- 编译前，执行插件


## Install
```
npm i auto-try-catch -D
```


## Usage
```javascript
// webpack.config.js
const addTryCatch = require('auto-try-catch')

module.exports = {
  ...
  plugins: [
    ...
    new addTryCatch({
      dir: ['src', 'constant'], 
      ignored: /someFileName|someDirName/
    })
  ]
}

```

## Options
- dir (array):  需要监听的目录名
- ignored (regexp): 过滤掉的文件名、目录名

