import * as Bob from '@bob-plug/core';
import { getSupportLanguages } from './lang';
import { _translate } from './translate';
import * as anki from './anki';


// 使用 bob 实现的 require 方法加载本地库,
var formatString = require('./libs/human-string');


export function supportLanguages(): Bob.supportLanguages {
  return getSupportLanguages();
}

// @ts-ignore
global.supportLanguages = supportLanguages;

// // 判断是否是单个单词
// function isWord(text) {
//   // 使用正则表达式匹配单词
//   const wordRegex = /^[A-Za-z]+$/;
  
//   // 判断text是否只包含一个单词
//   return text.trim().split(/\s+/).every(word => wordRegex.test(word));
// }

// https://ripperhe.gitee.io/bob/#/plugin/quickstart/translate
export function translate(query: Bob.TranslateQuery, completion: Bob.Completion) {
  const wordRegex = /^[A-Za-z]+$/;
  let testwd = query.trim().split(/\s+/).every(word => wordRegex.test(word))
  // 测试是否是单词
  if (testwd === true) {
    const { text = '', detectFrom, detectTo } = query;
    const str = formatString(text);
    const params = { from: detectFrom, to: detectTo, token: Bob.api.getOption('token') };
      // 翻译
  let res = _translate(str, params);
  res
    .then((result) => {
      completion({ result })
      return result
    })
    .then((translateResult) => {
      // 查询anki是否已经有翻译结果
      anki.findNote(text)
        .then((res) => {
          if (res) {
            Bob.api.$log.info('已经存在翻译结果');
          } else {
            // 保存到anki
            anki.save(str, translateResult.raw.target[0]);
          }
        })
        .catch((error) => {
          // anki 没打开的异常
          Bob.api.$log.error("catch 1");
          Bob.api.$log.error(JSON.stringify(error));
          const savePath = Bob.api.getOption('savePath')
          Bob.api.$log.error(`savePath:${savePath}`);
          Bob.api.$log.error(`${str} ${translateResult.raw.target[0]}`);
          const writeResult = Bob.api.$file.write({
            data: Bob.api.$data.fromUTF8(`${str} ${translateResult.raw.target[0]}`),
            path: `$sandbox/${savePath}`
          });
          if (!writeResult) {
            Bob.api.$log.error("写入文件失败");
          }
          Bob.api.$log.error(JSON.stringify(writeResult));
          Bob.api.$log.error(`save success`);
        });
    })
    .catch((error) => {
      Bob.api.$log.error("catch 2");
      Bob.api.$log.error(JSON.stringify(error));
      if (error?.type) return completion({ error });
      completion({ error: Bob.util.error('api', '插件出错', error) });
    })
  } else {
    Bob.api.$log.info('不是单词');    // 如果a为false则输出"退出"
  }
}


// @ts-ignore
global.translate = translate;



