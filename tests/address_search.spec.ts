import { test } from '@playwright/test';
import fs, { mkdirSync } from 'fs'
import path from 'path';
import { generate } from 'csv';
// 异步方法
test('shenzhen_address', async ({ page }) => {
  const searchContent = '金星大厦'
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
    
    // 等待接口响应
    const databuildingresponsePromise = page.waitForResponse(response => 
      response.url().includes('/data-building/getBackListAllByWrapper') && response.status() === 200
    );
    
    // 名称
    const addressName = await page.locator(`#app > div > div.box > div > div:nth-child(${i}) > div.right > div.buildingName`).textContent()
    
    
    result += addressName+'\n';

    await page.locator(`#app > div > div.box > div > div:nth-child(${i})`).click();

    

    const response = await databuildingresponsePromise;
    const data = await response.json();
    let totalhouse = 0
    if(data.code != -1){
      totalhouse = data.data[0].totalhouse;
      const datahouseResponsePromise = await page.waitForResponse(response => 
        response.url().includes('/data-house/getBackListAllByWrapper') && response.status() === 200,
      );
      const response1 = datahouseResponsePromise;
      const jsonData = await response1.json();
      if(jsonData.code != -1){
        await page.waitForSelector('.buildMsg',{state:'visible'});
      }
      await page.waitForSelector('#app > div > div:nth-child(5) > div.build > div.buildinfo > div:nth-child(4)',{state:'visible'})
      const continfo = await page.locator('.continfo').allTextContents();
      // 行政区划
      const administrativeDivisions = continfo[0].split('：')[1].trim()
      // console.log(administrativeDivisions);
      result+='行政区划：'+administrativeDivisions+'|'+'\n';
      // 楼栋编码
      const buildingCode = continfo[1].split('：')[1].trim()
      // console.log(buildingCode)
      result += '楼栋编码：'+buildingCode+'|'+'\n';
      // 标准地址
      const standardAddress = continfo[2].split('：')[1].trim()
      // console.log(standardAddress);
      result += '标准地址：'+standardAddress+'|'+'\n';
      const floor = await page.locator('.rowtitle').allTextContents();
      // 层数
      if(floor && floor.length >0){
        const lastfloor = floor[floor.length-1]
        result += '层数：' + lastfloor+'|'+'\n';
      }
      else{
        result += '层数：' + '0层|'+'\n\n';
      }
      // console.log(lastfloor);
      if(totalhouse){
        result += '户数：' + totalhouse+'\n\n';
      }

    }else{
      await page.waitForSelector('#app > div > div:nth-child(5) > div.build > div.buildinfo > div:nth-child(3)',{state:'visible'})
      const continfo = await page.locator('.continfo').allTextContents();
      // 楼栋编码
      const buildingCode = continfo[0].split('：')[1].trim()
      // console.log(buildingCode)
      result += '楼栋编码：'+buildingCode+'|'+'\n';
      // 标准地址
      const standardAddress = continfo[1].split('：')[1].trim()
      // console.log(standardAddress);
      result += '标准地址：'+standardAddress+'|'+'\n\n';
    }
    
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


// function writeCsv(){
//   const headers:string[] = ["文件夹","名称","经度","纬度","海拔","文本显示风格","图标样式","","","","",""]
//   const data:string[] = 

// }




