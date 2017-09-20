import {parseUserName} from "/imports/slack/helpers";

Router.route('/slack/events/request', function () {
  const req = this.request;
  const res = this.response;
  console.log(req.body);
  res.end(JSON.stringify(req.body));
  
  console.log('------ SETTING MESSAGE FOR EVENT -------');
  console.log('TEAMID: ', req.body.team_id);
  const teamId = req.body.team_id;
  
  console.log('EVENT MESSAGE', req.body.event);
  if(teamId) {
    console.log('SENDING MESSAGE TO BOT');
    const bot = BotStorage[teamId];
    bot.handleMessageEvent(req.body.event);
  }
  
}, {where: 'server'});

Router.route('/slack/command/report', function () {
  const req = this.request;
  const res = this.response;
  const data = {...req.body};
  
  const splitData = data.text.split(' ');
  console.log('DATA', data.text);
  const userString = splitData.shift();
  const reason = splitData.join(' ');
  
  console.log('REPORTING', userString, reason.trim());
  if(!reason || reason.trim() === '') {
    console.log('NO REASON GIVEN!');
    res.end('You did not give a reason for the report.');
    return;
  }
  
  if(!/^<@[A-Z0-9]{9}\|[a-zA-Z0-9_\-.]{1,100}>$/.test(userString)) {
    console.log('INVALID USER STRING');
    res.end('This is not a valid user');
    return;
  } else {
    const {userId, username} = parseUserName(userString);
    console.log('FINDING IF USER REPORTED ALREADY');
    const didUserReport = Reported.find({user: userId, team_id: data.team_id, reporters: {$elemMatch: {user: data.user_id}}}).count();
    console.log('REPORTED BEFORE', didUserReport > 0);

    if(didUserReport > 0) {
      res.end('You already reported this user');
    } else {
      res.end('The user has been reported');
    }
    
    data.target_user = userId;
    data.target_username = username;
    data.reason = reason;
  }
  
  console.log('SET EXTRA BODY PARAMS', data);
  const teamId = data.team_id;
  
  if(teamId) {
    console.log('SENDING MESSAGE TO BOT');
    const bot = BotStorage[teamId];
    bot.handleMessageEvent(data);
  }
  
}, {where: 'server'});