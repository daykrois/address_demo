import { test } from '@playwright/test';
import fs, { mkdirSync } from 'fs'
import path from 'path';

// 异步方法
test('shenzhen_address', async ({ page }) => {
  const searchContent = '伍屋村'
  // 文件目录
  const dirPath = searchContent
  // 结果文件名
  const fileName = `${searchContent}.txt`
  await page.goto('https://tybm.szzlb.gov.cn:10000/AddressWeb/#/', { timeout: 0 });

  await page.getByPlaceholder('仅支持楼栋地址、楼栋名称、房屋编码数据查询').fill(searchContent);
  await page.locator('.el-input-group__append').click();
  // 等待页面元素可见
  await page.waitForSelector('#app > div > div.box > div',{state:'visible'})
  const allContentElements = await page.locator('.content').elementHandles();
  let count = allContentElements.length;
  // 结果
  let result = ''
  for(let i = 1; i < count; i++){
    // 名称
    const addressName = await page.locator(`#app > div > div.box > div > div:nth-child(${i}) > div.right > div.buildingName`).textContent()
    
    
    result += addressName+'\n';
    // 等待接口响应
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/data-building/getBackListAllByWrapper') && response.status() === 200
    );

    await page.locator(`#app > div > div.box > div > div:nth-child(${i})`).click();
    await page.waitForSelector('.buildMsg',{state:'visible'});

    const response = await responsePromise;
    const data = await response.json();
    const totalhouse = data.data[0].totalhouse;
    // let capturedResponse
    // let totalHouse
    // const handleResponse = async (response) => {
    //   if (response.url().includes('/data-building/getBackListAllByWrapper')) {
    //     capturedResponse = await response.json();
    //     page.off('response', handleResponse);
    //   }
    // };

    // page.once('response', handleResponse);
    // if (capturedResponse) {
    //   totalHouse = capturedResponse.data[0].totalhouse;
    //   console.log(totalHouse)
    // }

    

    await page.waitForSelector('#app > div > div:nth-child(5) > div.build > div.buildinfo > div:nth-child(4)',{state:'visible'})
    
    // 截图
    // await page.evaluate(()=>{
    //   document.querySelector("#app > div > div:nth-child(5) > div.build").style.overflowY='visible'
    // })
    // // await page.locator('#app > div > div:nth-child(5) > div.build').screenshot({path:`${dirPath}\\${fileName}.png`})
    // await page.screenshot({fullPage:true,path:`${dirPath}\\${addressName}.png`})

    const continfo = await page.locator('.continfo').allTextContents();
    // 行政区划
    const administrativeDivisions = continfo[0].split('：')[1].trim()
    // console.log(administrativeDivisions);
    result+='行政区划：'+administrativeDivisions+'\n';
    // 楼栋编码
    const buildingCode = continfo[1].split('：')[1].trim()
    // console.log(buildingCode)
    result += '楼栋编码：'+buildingCode+'\n';
    // 标准地址
    const standardAddress = continfo[2].split('：')[1].trim()
    // console.log(standardAddress);
    result += '标准地址：'+standardAddress+'\n';
    const floor = await page.locator('.rowtitle').allTextContents();
    // 层数
    const lastfloor = floor[floor.length-1]
    // console.log(lastfloor);
    result += '层数：' + lastfloor+'\n';
    result += '户数：' + totalhouse+'\n\n';
    await page.locator('#app > div > div:nth-child(5) > div.toptext').click();
    
  }
  writeFile(dirPath,fileName,result)

});

function writeFile(dirPath:string,fileName:string,data:string):void{
  const absoluteDirPath = path.resolve(dirPath)
  const filePath = path.join(absoluteDirPath,fileName)

  try{
    if(!fs.existsSync(absoluteDirPath)){
      fs.mkdirSync(absoluteDirPath,{recursive:true})
      console.log(`${absoluteDirPath}目录已创建`)
    }
    fs.writeFileSync(filePath,data)
    console.log(`文件已保存至：${filePath}`)
  }catch(err){
    console.log('写入文件出错',err)
  }
}





