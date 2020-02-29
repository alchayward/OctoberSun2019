var backgroundColor = '#CFE2F3'
var gameColor = '#F4CCCC'

class EliminationBracket extends Bracket {
 constructor(sheet) {
   super(sheet);
   this.numTeams = sheet.getRange('numTeams').getValue();
 }
   
  seedElim(teams){
    var numTeams = teams.length;
    var games = this.eliminationGames(numTeams); 
    var final = games[games.length-1];
    nameTeam(final, teams);    
    return games;
  }
  
  writeBracket(){
    var teams = this.sheet.getRange('teams').offset(0,0,this.numTeams,1).getValues().flat();
    var numTeams = teams.length;
    var games = this.eliminationGames(numTeams); 
    var final = games[games.length-1];
    nameTeam(final, teams);
    this.drawElim(games);
    var gameRange = this.sheet.getRange('games');
    gameRange.offset(0,0,games.length,6).setValues(games.map(g=>[g.r, g.gameNumber, g.teams[0], g.teams[1], g.score1,g.score2]));
  }
  
  writeBracBrackets(){
    var teams = this.sheet.getRange('teams').offset(0,0,this.numTeams,1).getValues().flat();
    
    var numTeams = 16;
    var brackets = [{teamsIn:5,teamsOut:2}, {teamsIn:7, teamsOut:2},{teamsIn:4, double:false}];
    
    var games = bracEliminationGames(brackets);

    var final = last(last(games));
    console.log(final);
    nameTeam(final, teams);
    brackets.forEach( (b, i) => b.games = games[i]);
    
    this.drawBracElim(brackets);
    // write games into sheet
    var gameRange = this.sheet.getRange('games');
    games = games.flat();
    gameRange.offset(0,0,games.length,6).setValues(games.map(g=>[g.r, g.gameNumber, g.teams[0], g.teams[1], g.score1,g.score2]));
  }
  
  gameFromRow(row) {
    const [round, gameNumber, team1, team2, score1, score2, bracketName=null] = row;
    return {round:round, gameNumber:gameNumber, team1:team1, score1:score1, bracketName:bracketName};
  }

  getScoreFormatRule(range) {
    var rules = [];
    var formula = ("=GT(" + range.offset(1, 1,1,1).getA1Notation() + "; " + range.offset(2, 1,1,1).getA1Notation() + ")");
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setBold(true)
               .setRanges([range.offset(1, 0,1,2)])
               .build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setStrikethrough(true)
               .setRanges([range.offset(2, 0,1,2)])
               .build());
    
    formula = ("=LT(" + range.offset(1, 1,1,1).getA1Notation() + "; " + range.offset(2, 1,1,1).getA1Notation() + ")");
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setBold(true)
               .setRanges([range.offset(2, 0,1,2)])
               .build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
               .whenFormulaSatisfied(formula)
               .setStrikethrough(true)
               .setRanges([range.offset(1, 0,1,2)])
               .build());
    return rules;
  }
  
  drawGame(game, cell, gameRow){
    var cRange = cell.offset(0,0,1,5);
    cRange.setFormulas([[`=CONCATENATE("Game #"; B${gameRow})`,
                         `=C${gameRow}`,
                         `=IF(ISBLANK(E${gameRow}); "-";E${gameRow})`,
                         `=IF(ISBLANK(F${gameRow}); "-";F${gameRow})`,
                         `=D${gameRow}`]]);
    cRange.setBackground(gameColor)
    .setBorder(true, true, true, true, false, false)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setFontWeight('normal');
    cell.offset(0, 0,1,1).setFontWeight('bold');
  }
  
  drawSingleElim(games, start=[4,8], bgColor=backgroundColor){
    const numRounds = Math.max(...games.map(g=>g.r));
    const rShift = (games.filter(x=>x.r==1).length > games.filter(x=>x.r==2).length) ? 1 : 0;
    var maxHeight = 2 * Math.pow(2, numRounds-2+rShift);
    var length = 6 * (numRounds);
    
    var sheet = this.sheet;
    var canvas  = sheet.getRange(start[0], start[1]-1, maxHeight+1, length+1);
    
    canvas.clear()
    .setBackground(bgColor)
    .setBorder(true, true, true, true, false, false)
    .setFontWeight('normal')
    .setWrap(true);
    
    var gameRange = sheet.getRange('games');
    var formatRules = [];
    const drawGame = this.drawGame;
    const getScoreFormatRule = this.getScoreFormatRule;
    
    var recDraw  = function (game, center){
      var pos  = [center[0] + start[0], center[1] + start[1]];
      console.log('pos: ', pos, game);
      var cell = sheet.getRange(pos[0], pos[1]);
      game.pos = pos;
      drawGame(game, cell, gameRange.getRow()+game.gameNumber-1);
      formatRules.push(getScoreFormatRule(cell));
      console.log('game', game, 'ind', games.indexOf(game));
      if (games.indexOf(game.seeds[0]) > -1) {
        const shift = Math.pow(2, game.seeds[0].r-2+rShift);
        recDraw(game.seeds[0], [center[0] - shift,center[1]-6]);
        cell.offset(-shift,-1,shift+1,1).setBackground('black'); //  connect
      }
      if (games.indexOf(game.seeds[1]) > -1) {
        const shift = Math.pow(2, game.seeds[1].r-2+rShift);
        recDraw(game.seeds[1], [center[0] + shift, center[1]-6]);
        cell.offset(0,-1,shift+1,1).setBackground('black');  //  connect
      }
    }
    
    var final = last(games);

    recDraw(final, [Math.ceil(maxHeight/2),length-6], maxHeight);
    //var rules = this.sheet.getConditionalFormatRules();
    //rules = rules.concat(formatRules.flat());
    //sheet.setConditionalFormatRules(rules); 
    
    for (var r = 0; r< numRounds*0; r++) { // make widths nice
      sheet.setColumnWidth(start[1] + 6 * ( r ), 50);
      sheet.setColumnWidth(start[1] + 6 * ( r ) + 1, 100);
      sheet.setColumnWidth(start[1] + 6 * ( r ) + 2, 30);
      sheet.setColumnWidth(start[1] + 6 * ( r ) + 3, 30);
      sheet.setColumnWidth(start[1] + 6 * ( r ) + 4, 100);
      sheet.setColumnWidth(start[1] + 6 * ( r ) + 5, 10);
    }
 
  }
  
  drawDoubleElim(games){}  
  
  drawBracElim(brackets, start=[4,8], bgColor=backgroundColor){

    for (var bracket of brackets){
      if (!bracket.double) {
         this.drawSingleElim(bracket.games, start);
         start = [ start[0]+last(bracket.games).pos[0], last(bracket.games).pos[1]+6];
      }
    }
  }
  
}

class SingleEliminationBracket extends EliminationBracket {
 constructor(sheet) {
   super(sheet);
 }
  
  eliminationGames(numTeams){return singleEliminationGames(numTeams);};
  
  drawElim(games){return this.drawSingleElim(games);};
 
}

class doubleEliminationBracket extends Bracket {
 constructor(sheet) {
   super(sheet);
 }
   
  eliminationGames(numTeams) {return doubleEliminationGames(numTeams);};
  
}

function makeSingleElim () {
  const selB = new SingleEliminationBracket(SpreadsheetApp.getActiveSheet());
  selB.writeBracket();
  return selB;
}

function makeDoubleElim () {
  const selB = new doubleEliminationBracket(SpreadsheetApp.getActiveSheet());
  selB.writeBracket();
  return selB;
}

function makeBrackElim () {
  const selB = new EliminationBracket(SpreadsheetApp.getActiveSheet());
  selB.writeBracBrackets();
  return selB;
}

function nameTeam(game, teamNames) {
  var teams = [null,null];
  console.log(game);
  game.teams=teams;
  var seeds = game.seeds;
  for (let s=0;s<2;s++) {
    
    if (seeds[s]>0){
      teams[s]=teamNames[seeds[s]-1];
      seeds[s]=null;
    }
    else {
      if (game.major && s==0) { var wl = false; } else { var wl=true; nameTeam(seeds[s], teamNames); }
      teams[s] = (wl ? 'Winner #' : 'Loser #') + seeds[s].gameNumber.toString();
    }
  }
}

function drawLine(start, end, sheet){
  var range = null;
  return range;
}

function singleEliminationGames(numTeams) {

  // find power of two >= team number
  const numRounds = Math.ceil(Math.log2(numTeams));

  // work backwards, rounds and games. 
  var gameNumber = numTeams-1;
  var final = {r:numRounds, gameNumber:gameNumber, seeds:[1,2]}; 
  gameNumber--;
  var allGames = [final];
  var thisRound = [final];
  for (r = 2; r <= numRounds; r++){

    let lastRound = thisRound; thisRound = [];
    for (const g of lastRound) {
      for (const s of [1,0]) { 
        const t2 = Math.pow(2,r)+1-g.seeds[s];
          if (t2 <= numTeams) {
            var newGame = {r:numRounds-r+1, gameNumber:gameNumber, seeds:[g.seeds[s], t2]};
            gameNumber--; 
            g.seeds[s]=newGame; 
            allGames.push(newGame); 
            thisRound.push(newGame);
        }
      }    
    }
  }
  return allGames.reverse();
}

function getWinner(game){
   if (game==null) {return null;}
   else if (game.seeds[0] == null && game.seeds[1]==null) {return null;}
   else if(game.seeds[0] == null) {return game.seeds[1];}
   else if(game.seeds[1] == null) {return game.seeds[0];}
   else {return game;}
}

function getAsRounds(games){
  var maxRounds = Math.max(...games.map(g=> g.r));
  var rounds = []; for (var i=0; i<maxRounds; i++) {rounds.push(games.filter(g=>g.r==i+1));}
  return rounds;
}

function doubleEliminationGames(numTeams) {
  
  // do again for power of 2, then trim games.
  var wB = getAsRounds(singleEliminationGames(ceilLog2(numTeams)));
  var numRounds = wB.length+1
  
  var lB = [];
  for (var r=0; r<wB.length; r++) {
    var wRound = wB[r];
    var nGames = wRound.length;
    var gn = wRound[wRound.length-1].gameNumber;
    var lbRound = [];

    // major games
    for (var g=0;g<wRound.length;g++){
      var wGame = wRound[g];
      wGame.WB = true;
      gn+= 1/(2*nGames+1); // will use this to put the games in order later.
      
      if (wGame.seeds[1] > numTeams){ // remove games we don't play in the winners bracket.
        wRound[g]=null; // remove game from list;
        var feedGame = wB[1][Math.floor(g/2)];
        feedGame.seeds[g%2] = wGame.seeds[0];
        var lBGame = null;
      } else {
        var s2Game = getWinner((lB.length==0) ? null : lB[r-1][lB[r-1].length-g-1]); // get minor round winners from last  round.
        var lBGame = {r: wGame.r, gameNumber:gn, seeds:[wGame, s2Game], WB:false, major:true};
      }
      lbRound.push(lBGame);
    }

    // minor games
    for (var g=0;g<lbRound.length-1;g+=2){
      gn+= 1/(2*nGames+1);
      var s1 = getWinner(lbRound[g]); var s2 = getWinner(lbRound[g+1]);
      var lBGame = {r: wGame.r, gameNumber:gn, seeds:[s1, s2], WB:false, major:false};
      lbRound.push(lBGame);
    }
    lB.push(lbRound);
  }
  
  var final = {r:numRounds, major: false, WB:true,
                seeds:[wB[wB.length-1][0], lB[lB.length-1][0]],
                 gameName:'final', gameNumber:2*numTeams};

  var allGames = [final, ...wB.flat(), ...lB.flat()].filter(g=>g)
  .filter(g=>(g.seeds.indexOf(null)==-1)) // get rid of games we don't plat
  .sort((x,y) => x.gameNumber - y.gameNumber);  // put into order
  allGames.forEach((g,i) => g.gameNumber=i+1); // set Game numbers
  return allGames; 
}

function bracEliminationGames(format){
  // format is list of brackets {teamsIn: n, teamsOut: m, double:False}
  var brackets = [];
  let lastBracketGames = [];
  let lastGameNumber = 0;
  let teamsLeft = format.map(g=>g.teamsIn).reduce((a,b)=>a+b);
  for (b=0;b<format.length;b++) {
    const {teamsIn, teamsOut=1, double=false} = format[b];
    let numTeams = teamsIn + lastBracketGames.length;
    var games = (double ? doubleEliminationGames : singleEliminationGames)(numTeams);
    games = games.slice(0,games.length-teamsOut+1);
    // add games from last bracket
  
    for (game of games){
      game.gameNumber+=lastGameNumber; 
      game.bracket=b+1;
      for (s of [0,1]) { 
        if(game.seeds[s]>teamsIn) {
          game.seeds[s] = lastBracketGames[game.seeds[s]-teamsIn-1];}
        else if (game.seeds[s] <= teamsIn) {game.seeds[s] += teamsLeft-teamsIn;};
      }
    }
    lastBracketGames = games.slice(games.length-teamsOut, games.length);
    lastGameNumber = last(games).gameNumber;
    teamsLeft -= teamsIn;
    brackets.push(games);
  }
  return brackets;
}