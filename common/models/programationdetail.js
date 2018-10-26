'use strict';
var pdf = require('html-pdf');
var fs = require('fs');
const UNIT_MEASURENMENT = {
  GRAMS: 'Gramos',
  KILO: 'kilos',
  MILLILITERS: 'Mililitros',
  CM3: 'centímetros cúbicos',
  CAN: 'latas',
};
module.exports = function(Programationdetail) {
  Programationdetail.download = function(id, cb) {
    Programationdetail.findOne({where: {id: id}}, function(err, detail) {
      if (err) return console.log(err);

      var html = fs.readFileSync('client/templates/acta.html', 'utf8');
      var options = {format: 'Letter'};
      let dateActa = detail.actaDate.toISOString().replace(/T/, ' ').replace(/\..+/, '')
      html = html.replace('{actaDate}', dateActa);
      html = html.replace('{committee}', detail.committeeName);
      let style = 'align="left" bgcolor="#f2f2f2" style="font-family: Verdana, Geneva, Helvetica, Arial, sans-serif; font-size: 12px; color: #000000; padding:10px; padding-right:0;"';
      let rations = detail.rations.map((item)=> (
      `
      <tr>
      <td ${style}>${item.productName}</td>
      <td ${style}>${item.totalRation}</td>
      <td ${style}>${UNIT_MEASURENMENT[item.unitOfMeasure]}</td>
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

  Programationdetail.remoteMethod('download', {
    isStatic: true,
    http: {path: '/download/:id', verb: 'get'},
    accepts: [
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
};
