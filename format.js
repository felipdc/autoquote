const fs = require('fs');

const raw = fs.readFileSync('instance_sizes.json');
const data = JSON.parse(raw);

const newData = data.map((instance) => ({
  name: instance['API Name'],
  vcpu: +(instance.vCPUs.match(/\d*/)),
  ram: +(instance.Memory.match(/\d*.\d/)),
}));

fs.writeFileSync('new_instance_sizes.json', JSON.stringify(newData));
