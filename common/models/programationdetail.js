'use strict';
var pdf = require('html-pdf');
var fs = require('fs');
var path = require('path');
const UNIT_MEASURENMENT = {
  GRAMS: 'Gramos',
  KILO: 'kilos',
  MILLILITERS: 'Mililitros',
  CM3: 'centímetros cúbicos',
  CAN: 'latas',
};
module.exports = function(Programationdetail) {
  Programationdetail.download = function(programationId, id, cb) {
    Programationdetail.findOne({where: {id: id}, include: ['programation', 'committee']}, function(err, detail) {
      if (err) return console.log(err);

      var html = fs.readFileSync('client/templates/acta.html', 'utf8');
      var options = {
        format: 'Letter',
        base: path.join(__dirname, '../../client/templates/'),
        header: {
          height: '35mm',
          contents: `
          <table>
          <tr>
            <td style="width: 60px;">
              <img src="file://${require.resolve('../../client/templates/logo.png')}" width="50"/>
            </td>
            <td>
              <h5>Municipalidad provincial de Tambogrande</h5>
              <h6>Gerencia de desarrollo social</h6>
            </td>
          </tr>
          </table>
          `,
        },
      };
      console.log(path.join(__dirname, '../../client/templates'));
      let dateActa = detail.actaDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
      html = html.replace('{{image}}',  `file://${require.resolve('../../client/templates/logo.png')}`);
      html = html.replace('{actaDate}', dateActa);
      html = html.replace('{committee}', detail.committeeName);
      html = html.replace('{{populatedCenterName}}', detail.committee().populatedCenterName);
      // console.log("==========", detail.committee());
      let style = 'align="left" bgcolor="#f2f2f2" style="font-family: Verdana, Geneva, Helvetica, Arial, sans-serif; font-size: 12px; color: #000000; padding:10px; padding-right:0;"';
      let rations = detail.rations.map((item, index)=> (
      `
      <tr>
      <td ${style}>${index + 1}</td>
      <td ${style}>${item.productName}</td>
      <td ${style}>${item.totalRation}</td>
      <td ${style}>${UNIT_MEASURENMENT[item.unitOfMeasure]}</td>
      <td ${style}>${detail.programation().days}</td>
      </tr>
      `
      )).join('');
      html = html.replace('{rations}', rations);
      console.log(detail);
      pdf.create(html, options).toStream(function(err, stream) {
        if (err) return console.log(err);
        cb(null, stream, 'application/pdf');
      });
    });
  };

  Programationdetail.confirmdistribution = function(id, cb) {
    Programationdetail.update({id: id}, {actaDate: new Date(), withActa: true}, (err, data) => {
      if (err) return console.log(err);
      cb(null, data);
    });
  };

  Programationdetail.removedistribution = function(id, cb) {
    Programationdetail.update({id: id}, {actaDate: new Date(), isDistributed: false}, (err, data) => {
      if (err) return console.log(err);
      cb(null, data);
    });
  };

  Programationdetail.remoteMethod('download', {
    isStatic: true,
    http: {path: '/download/:programationId/:id', verb: 'get'},
    accepts: [
        {arg: 'programationId', type: 'string'},
        {arg: 'id', type: 'string'},
    ],
    returns: [
      {arg: 'body', type: 'file', root: true},
      {arg: 'Content-Type', type: 'string', http: {target: 'header'}},
    ],
  });

  Programationdetail.remoteMethod('confirmdistribution', {
    isStatic: true,
    http: {path: '/confirmdistribution/:id', verb: 'put'},
    accepts: [
        {arg: 'id', type: 'string'},
    ],
    returns: [
      {arg: 'res', type: 'object', 'http': {source: 'res'}}
    ],
  });
  Programationdetail.remoteMethod('removedistribution', {
    isStatic: true,
    http: {path: '/removedistribution/:id', verb: 'put'},
    accepts: [
        {arg: 'id', type: 'string'},
    ],
    returns: [
      {arg: 'res', type: 'object', 'http': {source: 'res'}},
    ],
  });
};
