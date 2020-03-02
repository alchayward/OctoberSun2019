function dispMsg(msg){
  var ui = SpreadsheetApp.getUi(); 
  var result = ui.alert(msg, ui.ButtonSet.OK);
  return result
}

function flat(arr, d = 1) {
   return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flat(val, d - 1) : val), [])
                : arr.slice();
};

function transpose(matrix) {return matrix[0].map((col, i) => matrix.map(row => row[i]));}

function last(a) {return a[a.length-1];}

function colToArray(col){ return col.map(x=> x[0]); }

function ceilLog2(n){return Math.pow(2,Math.ceil(Math.log2(n)));}

function sheetName() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  return sheet.getName();
}

// Use this code for Google Docs, Forms, or new Sheets.
function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .createMenu('Dialog')
      .addItem('Open', 'openDialog')
      .addToUi();
}

function openDialog() {
  var html = HtmlService.createHtmlOutputFromFile('index')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showModalDialog(html, 'Dialog title');
}



