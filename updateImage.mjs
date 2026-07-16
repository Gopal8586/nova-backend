import('./src/data/db.js').then(db => {
  const json = { heroImage: '/Images/Services/BipapCpapVentilator.webp' };
  db.default.query('UPDATE services SET details = details || $1::jsonb WHERE id = $2', [JSON.stringify(json), 'bipap-cpap-ventilator-rental-delhi-ncr'])
    .then(() => {
      console.log('Done');
      process.exit(0);
    });
});
