var classTypes = { 'swiss': SwissBracket, 'single elim':SingleEliminationBracket, 'double elim':DoubleEliminationBracket};

function onEdit(e) {
  var sheet = SpreadsheetApp.getActiveSheet();
  bracket = getBracketFromSheet(sheet);
  
  if (bracket) {
    var gamesRange = sheet.getRange('games');
    var row = e.range.getRow();
    var col = e.range.getColumn();
    //Check that your active cell is within your named range
    if (col >= gamesRange.getColumn() && col <= gamesRange.getLastColumn() && row >= gamesRange.getRow() && row <= gamesRange.getLastRow()) { //As defined by your Named Range
      writeAllGames();
      bracket.sortRangeAll();
      return  null;
    }
  }     
}

function getAllGames() {
  return getAllBrackets().map(b=> b.getGames().filter(g => g.bracketName === b.name)).flat();
}

function writeAllGames(){
  var allGames = getAllGames();
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('all games');
  s.getRange('allGames').clearContent();
  s.getRange(2,1,allGames.length, 6 ).setValues(allGames.map(x =>  [x.round, x.team1, x.team2, x.score1, x.score2, x.bracketName]));
}

function getBracketFromSheet(sheet) {
  console.log(sheet.getNamedRanges().map(x=>x.getName()));
  console.log(sheet.getNamedRanges().map(x=>x.getName()).indexOf('bracketType'));
  console.log(sheet.getName());
  if  (sheet.getNamedRanges().map(x=>x.getName()).indexOf('bracketType') < 0) {
    return null;
  } else {   
    var type = sheet.getRange('bracketType').getValue();
    if (type in classTypes) {
      const sb = new classTypes[type](sheet);
      return sb
    } else {
      return null;}
  }
}

function isBracket(sheet) {return Boolean(getBracketFromSheet(sheet));}