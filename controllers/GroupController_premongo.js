const Sequelize = require('sequelize');
const sequelize = require('../config/cfg/db');
var models = require('../models');
var contactController = require('./ContactController');

exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};


// Display detail page for a specific contact. 
exports.listGroup = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})
    models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
        }, 
        include: [{
            model: models.Contact,
            as: 'contacts',
            where: {
                userId: user_id,
            },
            /* attributes: {
                include: [[sequelize.fn('count', sequelize.col('groupId')), 'ccount'], [sequelize.fn('max', sequelize.col('contacts.id')), 'id']],
                exclude: ['id']
            }, */
            // raw: true,
            // joinTableAttributes: [],
            // through: { attributes: [] },
            attributes: [[sequelize.fn('count', sequelize.col('groupId')), 'ccount']],
        }],
        group: ['contacts.groupId'],
        order: [ 
            ['createdAt', 'DESC']
        ],
        // raw: true,
    })
    .then(grps => {

        // console.log('1groups are: ' + JSON.stringify(grps));
        grps = grps.map(grp => {
            // let ww1 = JSON.stringify(grp.contacts);
            let ww2 = JSON.parse(JSON.stringify(grp));
            // let cc = JSON.parse(JSON.stringify(grp.contacts)).map(r => {return r.ccount});
            let cc = ww2.contacts.map(r => {return r.ccount});
            console.log('grp.contacts.ccount = ' + cc[0]);
            
            // grp.contacts = cc || 0;
            // let nw =  Object.assign(ww2, { contacts1: 'cc || 0' });
            // console.log(JSON.stringify(grp));
            
            return Object.assign(ww2, { contacts: cc[0] || 0 });
        })
        // console.log('2groups are: ' + JSON.stringify(grps));

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/new_group', {
            page: 'CONTACT GROUPS',
            groups: true,
            grouptype: '',
            flashtype, flash,

            args: {
                grps: grps,
            }
        });
    });

}

exports.listSMSGroup = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})
    models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
            platformtypeId: 1
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then(grps => {
        // console.log('groups are: ' + JSON.stringify(grps) + '; flash: ' + req.flash('error'));

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/new_group', {
            page: 'CONTACT GROUPS',
            groups: true,
            grouptype: 'SMS',
            flashtype, flash,

            args: {
                grps: grps,
            }
        });
    });

}

exports.listWAGroup = (req, res) => {
    var user_id = req.user.id;

    // ContactGroup.findAll()
    // ContactGroup.findAll({ where: { userId: { [Op.eq]: req.query.uid} }})
    models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
            platformtypeId: 2
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    })
    .then(grps => {
        // console.log('groups are: ' + JSON.stringify(grps) + '; flash: ' + req.flash('error'));

        var flashtype, flash = req.flash('error');
        if(flash.length > 0) {
            flashtype = "error";           
        } else {
            flashtype = "success";
            flash = req.flash('success');
        }

        res.render('pages/dashboard/new_group', {
            page: 'CONTACT GROUPS',
            groups: true,
            grouptype: 'WhatsApp',
            flashtype, flash,

            args: {
                grps: grps,
            }
        });
    });

}

exports.addGroup = async (req, res) => {
    var user_id = req.user.id;
    var fl = { mtype: null, msg: '', code: '' };

    console.log('form details are now...'); 
    console.log('form details are now: ' + JSON.stringify(req.body)); 

    const user = await models.User.findByPk(user_id);
    if(req.body.name.length > 0) {
        try {
            const group = await user.createGroup({
                name: req.body.name,
                description: req.body.description,
                can_optin: req.body.can_optin && (req.body.can_optin == 'on') ? true : false,
            });

            console.log('group created');

            if(req.externalapi) {
                req.body.group = group.id;
                if(req.body.contacts && req.body.contacts.length > 0){
                    return await contactController.addContact(req, res);
                } else {
                    fl.mtype = "SUCCESS"
                    fl.msg = group.id;
                    fl.code = "OK";
                }
            } else {
                fl.mtype = "SUCCESS"
                fl.msg = "Your new Group has been created.";
                fl.code = "E023";
            }
        } catch(err) {
            fl.mtype = "ERROR"
            if(err.name == 'SequelizeUniqueConstraintError') {
                fl.msg = "Group Name already exists on your account.";
                fl.code = "E020";
            } else {
                fl.msg = "An error occured. Kindly try again later or contact Admin.";
                fl.code = "E001";
            }
        }
    } else {
        fl.mtype = "ERROR"
        fl.msg = "Kindly enter a valid group name.";
        fl.code = "E021";
    }
    
    if(req.externalapi) {
        res.send({
            response: fl.mtype == "SUCCESS" ? {id: fl.msg, name: req.body.name} : "An error occurred.", 
            responseType: fl.mtype, 
            responseCode: fl.code, 
            responseText: fl.mtype == "SUCCESS" ? "Group created successfully." : fl.msg, 
        })
    } else {
        req.flash(fl.mtype.toLowerCase(), fl.msg);
        var backURL = req.header('Referer') || '/';
        res.redirect(backURL);
    }
}

//  from apiController
exports.saveGroup = async (req, res) => {

    var msg;

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";

        // console.log('optin='+(req.body.can_optin && (req.body.can_optin == "on") ? 'yes' : 'no'))
        const grp = await models.Group.findByPk(req.body.id)
        if(grp.userId == user_id) {
            try {
                const r = await grp.update({
                    ...( req.body.name ? {
                        name: req.body.name,
                    }: {}),
                    ...( req.body.description ? {
                        description: req.body.description,
                    }: {}),
                    can_optin: (req.body.can_optin && req.body.can_optin == "on") ? true : false,
                })
                
                if(req.externalapi && req.body.contacts && req.body.contacts.length) {
                    req.body.group = req.body.id;
                    return await contactController.addContact(req, res);
                } else msg = "success";
            } catch(r) {
                msg = "Error: Please try again later"
            }
        } else {
            msg = "Error: Invalid permission";
        }
    } catch (e) {
        msg =  "Authentication Error!!!";
    }
        
    res.send({
        response: msg,
    });

}

//  from apiController
exports.getGroups = async (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    var lnkgrp = req.params.lnkgrp;
    var gtype = req.query.grptype;

    var grps = await models.Group.findAll({ 
        where: { 
            userId: user_id,
            name: {
                [Sequelize.Op.ne]: '[Uncategorized]',
            },
            platformtypeId: gtype
        },
        order: [ 
            ['createdAt', 'DESC']
        ]
    });

    if(gtype == 1) {
        var non = await models.Group.findAll({ 
            where: { 
                userId: user_id,
                name: '[Uncategorized]',
            },
        });
    } else {
        var non = null;
    }

    if(non) grps.push(non[0]);

    res.send(grps); 

};

//  from apiController
exports.delGroup = (req, res) => {

    try {
        var user_id = req.user.id;
        if(user_id.length == 0)  throw "error";
    } catch (e) {
        res.send({
            error: "Authentication Error!!!"
        });
        return;
    }

    console.log('dele = ' + req.query.id);
    
    models.Group.findByPk(req.query.id)
    .then(grp => {
        if(grp.userId == user_id) {
            grp.destroy()
            .then((r) => {
                res.send({
                    response: "success",
                });
            }) 
            .error((r) => {
                res.send({
                    response: "Error: Please try again later",
                });
            })
        } else {
            res.send({
                response: "Error: Invalid permission",
            });
        }
    });
        

}
