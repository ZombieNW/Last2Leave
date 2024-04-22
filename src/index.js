const { Client, IntentsBitField, PermissionsBitField, Intents, EmbedBuilder } = require("discord.js");
require("dotenv").config();

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

const { REST, Routes } = require("discord.js");
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

var participantUsers = {};

const channelRoleMap = new Map();
//VC Channel ID, Role ID
channelRoleMap.set("1231376268360945745", "1231376608661864529"); //Lobby 1
channelRoleMap.set("1231376290553008170", "1231376627162943620"); //Lobby 2
channelRoleMap.set("1231376309335228507", "1231376645869408326"); //Lobby 3
channelRoleMap.set("1231376363735486614", "1231376663418376283"); //Lobby 4
channelRoleMap.set("1231376389828247664", "1231376680472285257"); //Lobby 5
channelRoleMap.set("1231376406412398713", "1231376699451641998"); //Lobby 6
channelRoleMap.set("1231376423114113105", "1231377028192800768"); //Lobby 7
channelRoleMap.set("1231376441741152266", "1231376719043231836"); //Lobby 8

const timezoneRoles = {
    "UTC-07:00 (PDT)": "1231412543654854706",
    "UTC-06:00 (MDT)": "1231412583052083281",
    "UTC-05:00 (CDT)": "1231412615213879369",
    "UTC-04:00 (EDT)": "1231412644167155802",
    "UTC+01:00 (BST)": "1231412675481829437",
    "UTC+02:00 (CEST)": "1231412700077096971"
};

//Commands
const commands = [
    {
        name: "l2l4",
        description: "Lock or unlock teams and voice channels",
        options: [
            {
                name: "action",
                description: "Lock or unlock teams and voice channels",
                type: 3, // STRING
                required: true,
                choices: [
                    {
                        name: "lock",
                        value: "lock"
                    },
                    {
                        name: "unlock",
                        value: "unlock"
                    }
                ]
            }
        ]
    },
    {
        name: "settimezone",
        description: "Select your timezone",
        options: [
            {
                name: "timezone",
                description: "Choose your timezone",
                type: 3,
                required: true,
                choices: [
                    {
                        name: "UTC-07:00 (PDT)",
                        value: "UTC-07:00 (PDT)"
                    },
                    {
                        name: "UTC-06:00 (MDT)",
                        value: "UTC-06:00 (MDT)"
                    },
                    {
                        name: "UTC-05:00 (CDT)",
                        value: "UTC-05:00 (CDT)"
                    },
                    {
                        name: "UTC-04:00 (EDT)",
                        value: "UTC-04:00 (EDT)"
                    },
                    {
                        name: "UTC+01:00 (BST)",
                        value: "UTC+01:00 (BST)"
                    },
                    {
                        name: "UTC+02:00 (CEST)",
                        value: "UTC+02:00 (CEST)"
                    }
                ]
            }
        ]
    }
];

client.on("ready", (c) => {
    console.log(`${c.user.tag} is online.`);
});

//VC STATUS CHANGE
client.on("voiceStateUpdate", (oldState, newState) => {
    var oldStateName = oldState.channel ? oldState.channel.name : "[no channel]";
    var newStateName = newState.channel ? newState.channel.name : "[no channel]";
    if (newState.channelId != oldState.channelId) {
        //Changed VC
        var didTheyComeBack = false;
        channelRoleMap.forEach(function (value, key) {
            //iterate channerolemap
            newState.member._roles.forEach((roleId) => {
                if (roleId == value && channelRoleMap.get(newState.channelId) == roleId) {
                    //Joined Back To Right VC
                    controlLog(
                        `:house: User ${newState.member.displayName} returned to VC ${newStateName} in ${
                            (Date.now() - participantUsers[newState.member.user.id]) / 1000
                        } seconds.`
                    );
                    delete participantUsers[newState.member.user.id];
                    didTheyComeBack = true;
                }
            });
        });
        if (didTheyComeBack == false) {
        if (didTheyComeBack == false) {
            //Changed
            if (!newState.channel) {
                //If user LEFT VC
                controlLog(`:man_running: User ${newState.member.displayName} left ${oldStateName}.`);
            } else if (oldStateName == "[no channel]") {
                //If user JOINED VC
                controlLog(`:arrow_right: User ${newState.member.displayName} joined ${newStateName}.`);
            } else {
                //If user SWAPPED VC
                controlLog(`:arrow_right: User ${newState.member.displayName} moved from ${oldStateName} to ${newStateName}`);
            }
            if (!participantUsers[oldState.member.user.id]) participantUsers[oldState.member.user.id] = Date.now(); //Only set if undefined
            if (!participantUsers[oldState.member.user.id]) participantUsers[oldState.member.user.id] = Date.now(); //Only set if undefined
        }
    }
});

//Bot Commands
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "l2l4") {
        if (!interaction.member.roles.cache.has(process.env.ADMIN_ID)) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }

        const action = interaction.options.getString("action");

        if (action === "lock") {
            await interaction.reply(":clock1: Locking Teams...");

            channelRoleMap.forEach(async (value, key) => {
                const lobby = await interaction.guild.channels.fetch(key);
                const role = await interaction.guild.roles.fetch(value);

                if (lobby.type !== 2) return; // If not a VC, return

                lobby.members.forEach(async (member) => {
                    controlLog(`Locking member ${member.displayName} to ${role.name}.`);
                    await member.roles.add(role);
                });
            });

            controlLog(":lock: Teams Locked.");
            controlLog(":clock1: Locking Voice Channels...");

            channelRoleMap.forEach(async (value, key) => {
                const lobby = await interaction.guild.channels.fetch(key);
                const role = await interaction.guild.roles.fetch(value);

                if (lobby.type !== 2) return; // If not a VC, return

                await lobby.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.Connect]
                    },
                    {
                        id: role.id,
                        allow: [PermissionsBitField.Flags.Connect]
                    }
                ]);
            });

            controlLog(":lock: Voice Channels Locked.");
        } else if (action === "unlock") {
            await interaction.reply(":clock1: Unlocking Voice Channels...");

            channelRoleMap.forEach(async (value, key) => {
                const lobby = await interaction.guild.channels.fetch(key);
                const role = await interaction.guild.roles.fetch(value);

                if (lobby.type !== 2) return; // If not a VC, return

                await lobby.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone,
                        allow: [PermissionsBitField.Flags.Connect]
                    }
                ]);
            });

            controlLog(":unlock: Voice Channels Unlocked");
            controlLog(":clock1: Unlocking Teams...");

            const members = await interaction.guild.members.fetch();
            members.forEach(async (member) => {
                await Promise.all(
                    Array.from(channelRoleMap.values()).map(async (value) => {
                        const role = await interaction.guild.roles.fetch(value);
                        if (member._roles.includes(role.id)) {
                            controlLog(`Unlocking member ${member.displayName} from ${role.name}.`);
                            await member.roles.remove(role);
                        }
                    })
                );
            });
            controlLog(":unlock: Teams Unlocked");
            await interaction.followUp("done :3");
        }
    } else if (interaction.commandName === "settimezone") {
        const existingTimezoneRoles = Object.values(timezoneRoles) //Get other time zone roles they have
            .map((id) => interaction.guild.roles.cache.get(id))
            .filter(Boolean);

        const member = interaction.member;
        const existingTimezoneRoleIds = existingTimezoneRoles.map((role) => role.id);

        const memberHasTimezone = member.roles.cache.some((role) => existingTimezoneRoleIds.includes(role.id));

        // Check if VCs are locked
        if ((await isVCsLocked(interaction.guild)) && memberHasTimezone) {
            return interaction.reply({ content: ":x: You can't change time zone during the Last to Leave\n but nice try lmfao", ephemeral: true });
        }

        const timezone = interaction.options.getString("timezone");
        const roleId = timezoneRoles[timezone];

        if (!roleId) {
            return interaction.reply(":x: Invalid timezone");
        }

        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return interaction.reply(":x: Invalid timezone");
        }

        try {
            await member.roles.remove(existingTimezoneRoles);
            await member.roles.add(role);
            await interaction.reply(`:clock1: Set timezone to ${role.name}`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error while assigning the role.`);
        }
    }
});

//Start Bot
(async () => {
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();

//ELIMINATE USERS GONE FOR 1 MINUTE
setInterval(() => {
    const currentTime = new Date().getTime();

    for (let user in participantUsers) {
        if (Date.now() - 60e3 > participantUsers[user]) {
            //If 1 minute has elapsed
            client.guilds.fetch(process.env.GUILD_ID).then((guild) => {
                //get guild by id
                guild.members.fetch(user).then((member) => {
                    //get user
                    const userRoles = member.roles.cache.map((role) => role.id);
                    const userTimeZoneRole = Object.keys(timezoneRoles).find((key) => userRoles.includes(timezoneRoles[key]));

                    if (!userTimeZoneRole) {
                        // User doesn't have a time zone role, eliminate them
                        eliminateUser(member);
                    } else {
                        const userTimeZoneOffset = getOffsetMilliseconds(userTimeZoneRole);
                        const userLocalTime = new Date(currentTime + userTimeZoneOffset);
                        const userLocalHour = userLocalTime.getHours();

                        if (userLocalHour >= 22 || userLocalHour < 10) {
                            // User's local time is between 11 PM and 10 AM, don't eliminate
                            return;
                        } else {
                            // User's local time is outside the allowed range, eliminate them
                            eliminateUser(member);
                        }
                    }
                });
            });
        }
    }
}, 1e3); //1 second

// Log to control room
function controlLog(msg) {
    client.guilds.fetch(process.env.GUILD_ID).then((guild) => guild.channels.fetch(process.env.CONTROL_ROOM_ID).then((channel) => channel.send(msg)));
}

// Check if any of the VCs have locked permissions
async function isVCsLocked(guild) {
    for (const [channelId, roleId] of channelRoleMap.entries()) {
        const channel = await guild.channels.fetch(channelId);
        const role = await guild.roles.fetch(roleId);

        const permissionOverwrites = await channel.permissionsFor(process.env.EVERYONE_ID);
        if (!permissionOverwrites.toArray().includes("Connect")) {
            return true;
        }
    }
    return false;
}

//Eliminate User
function eliminateUser(member) {
    delete participantUsers[member.user.id];
    channelRoleMap.forEach(function (value, key) {
        //Iterate Through ChannelRoleMap
        guild.roles.fetch(value).then((role) => {
            //Find Role from Role ID
            if (member._roles.includes(role.id)) {
                //If member has role
                member.roles.remove(role);
                controlLog(`:bangbang: User ${member.displayName} has been eliminated.`);
            } else {
                return;
            }
        });
    });
}

//Timezone Calculation
function getOffsetMilliseconds(timeZoneString) {
    const offsetHours = parseInt(timeZoneString.slice(4, 6), 10);
    const offsetMinutes = parseInt(timeZoneString.slice(7, 9), 10);
    const offsetMilliseconds = (offsetHours * 60 + offsetMinutes) * 60 * 1000;
    const isNegative = timeZoneString.startsWith("-");

    return isNegative ? -offsetMilliseconds : offsetMilliseconds;
}

client.login(process.env.BOT_TOKEN);
