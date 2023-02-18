const { Client, IntentsBitField, PermissionsBitField, Intents } = require("discord.js");
require('dotenv').config();
const client = new Client({
    intents: [
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.MessageContent
    ]
});

function controlLog(msg){
    client.guilds.fetch("1075592362702671966").then(guild => guild.channels.fetch("1076636328466337963").then(channel => channel.send(msg)));
}

const channelRoleMap = new Map();
//VC Channel ID, Role ID
channelRoleMap.set("1075592364392980562", "1076580189313704077");//Lobby 1
channelRoleMap.set("1075592427383034006", "1076580225040789504");//Lobby 2
channelRoleMap.set("1075592453589045308", "1076580244514938913");//Lobby 3
channelRoleMap.set("1075592472744439878", "1076580262214909972");//Lobby 4
channelRoleMap.set("1076579136191086653", "1076580278849523772");//Lobby 5
channelRoleMap.set("1076579158580269089", "1076580294439735407");//Lobby 6
channelRoleMap.set("1076579184106803331", "1076580308335480962");//Lobby 7
channelRoleMap.set("1076579202251370506", "1076580323611119787");//Lobby 8

client.on("ready", c =>{
    console.log(`${c.user.tag} is online.`);
});

var participantUsers = {};

client.on('voiceStateUpdate', (oldState, newState) => {
    var oldStateName = oldState.channel ? oldState.channel.name : "[no channel]";
    var newStateName = newState.channel ? newState.channel.name : "[no channel]";
    if(newState.channelId != oldState.channelId){//Changed VC
        var didTheyComeBack = false;
        channelRoleMap.forEach(function(value, key) {//iterate channerolemap
            newState.member._roles.forEach(roleId =>{
                if (roleId == value && channelRoleMap.get(newState.channelId) == roleId){
                    //Joined Back To Right VC
                    controlLog(`:house: User ${newState.member.displayName} returned to VC ${newStateName} in ${(Date.now() - participantUsers[newState.member.user.id])/1000 } seconds.`);
                    delete participantUsers[newState.member.user.id];
                    didTheyComeBack = true;
                }
            });
        });
        if(didTheyComeBack == false){
            //Changed
            if(!newState.channel){//If user LEFT VC
                controlLog(`:man_running: User ${newState.member.displayName} left ${oldStateName}.`);
            }
            else{//If user SWAPPED VC
                controlLog(`:arrow_right: User ${newState.member.displayName} moved from ${oldStateName} to ${newStateName}`);
            }
            if(!participantUsers[oldState.member.user.id]) participantUsers[oldState.member.user.id] = Date.now();//Only set if undefined
        }
    }
});

setInterval(() => {
    for(let user in participantUsers){
        if(Date.now() - 60e3 > participantUsers[user]){//If 1 minute has elapsed
            client.guilds.fetch("1075592362702671966").then(guild =>{//get guild by id
                guild.members.fetch(user).then(member => {//get user
                    delete participantUsers[user];//delete user variable
                    channelRoleMap.forEach(function(value, key) {//Iterate Through ChannelRoleMap
                        guild.roles.fetch(value).then(role =>{//Find Role from Role ID
                            if(member._roles.includes(role.id)){//If member has role
                                member.roles.remove(role);
                                controlLog(`:bangbang: User ${member.displayName} has been eliminated.`);
                                delete participantUsers[member.user.id];
                            }
                            else{
                                return;
                            }
                        });
                    });
                });
            });
        }
    }
}, 1e3);//1 second

client.on("messageCreate", msg => {
    if(!msg.member._roles.includes("1075618042568003616") && msg.content.includes("!l2l3")) return msg.channel.send("You don't have permission to do that."); //If not admin, return
    if(msg.content === "!l2l3 lock"){//Lock People To VCs
        msg.channel.send(":clock1: Locking Teams...");//Start Timer
        channelRoleMap.forEach(function(value, key) {//Iterate Through ChannelRoleMap
            msg.guild.channels.fetch(key).then(lobby => {//Find Channel from Lobby ID
                msg.guild.roles.fetch(value).then(role =>{//Find Role from Role ID
                    if (lobby.type !== 2) return;//If not a VC, Return
                    lobby.members.forEach(member => {//Iterate Members in VC
                        msg.channel.send(`Locking member ${member.displayName} to ${role.name}.`);
                        member.roles.add(role);//Give them Role
                    });
                });
            });
        });
        msg.channel.send(":lock: Teams Locked.");//Start Timer
        msg.channel.send(":clock1: Locking Voice Channels...");//Start Timer
        channelRoleMap.forEach(function(value, key) {//Iterate Through ChannelRoleMap
            msg.guild.channels.fetch(key).then(lobby => {//Find Channel from Lobby ID
                msg.guild.roles.fetch(value).then(role =>{//Find Role from Role ID
                    if (lobby.type !== 2) return;//If not a VC, Return
                    lobby.permissionOverwrites.set([
                        {//Don't allow everyone to join
                            id: msg.channel.guild.roles.everyone,
                            deny: [PermissionsBitField.Flags.Connect]
                        },
                        {
                            id: role,
                            allow: [PermissionsBitField.Flags.Connect]
                        }
                    ]);
                });
            });
        });
        msg.channel.send(":lock: Voice Channels Locked.");//Start Timer
    }
    if(msg.content === "!l2l3 unlock"){
        msg.channel.send(":clock1: Unlocking Voice Channels...");//Start Timer
        channelRoleMap.forEach(function(value, key) {//Iterate Through ChannelRoleMap
            msg.guild.channels.fetch(key).then(lobby => {//Find Channel from Lobby ID
                msg.guild.roles.fetch(value).then(role =>{//Find Role from Role ID
                    if (lobby.type !== 2) return;//If not a VC, Return
                    lobby.permissionOverwrites.set([
                        {//Allow everyone to join
                            id: msg.channel.guild.roles.everyone,
                            allow: [PermissionsBitField.Flags.Connect]
                        }
                    ]);
                });
            });
        });
        msg.channel.send(":unlock: Voice Channels Unlocked");//Start Timer
        msg.channel.send(":clock1: Unlocking Teams...");//Start Timer
        msg.guild.members.fetch().then(members =>{
            members.forEach(member =>{
                channelRoleMap.forEach(function(value, key) {//Iterate Through ChannelRoleMap
                    msg.guild.roles.fetch(value).then(role =>{//Find Role from Role ID
                        if(member._roles.includes(role.id)){//If member has role
                            msg.channel.send(`Unlocking member ${member.displayName} from ${role.name}.`);
                            member.roles.remove(role);
                        }
                        else{
                            return;
                        }
                    });
                });
            });
        })
        msg.channel.send(":unlock: Teams Unlocked");//Start Timer
    }
});

client.login(process.env.BOT_TOKEN);