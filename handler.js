/* eslint-disable no-console */
const fs = require('fs');

const raw = fs.readFileSync('sample.json');
const data = JSON.parse(raw);

const rawIntances = fs.readFileSync('new_instance_sizes.json');
const instancesData = JSON.parse(rawIntances);

const getInstanceSize = (instanceParams) => {
  let instanceSize = 1;
  let vcpu;
  let ram;
  if (!instanceParams.hasName) {
    ram = instanceParams.RAMGB;
    vcpu = instanceParams.VCPU;
  } else {
    const [params] = instancesData.filter(
      (instance) => instance.name === instanceParams.name,
    );
    ram = params.ram;
    vcpu = params.vcpu;
  }
  if (ram > 4 || vcpu > 2) {
    instanceSize = 2;
  }
  if (ram > 16 || vcpu > 4) {
    instanceSize = 3;
  }
  return instanceSize;
};

const getEc2Quote = (ec2Data) => {
  const svcIds = ec2Data.map((d) => {
    const ec2 = d.ConfiguraçãoDaInstância;
    const instanceSize = getInstanceSize(
      {
        VCPU: ec2.VCPU,
        RAMGB: ec2.RAMGB,
        hasName: ec2.EscolherTamanhoDaInstância,
        name: ec2.TamanhoInstância,
      },
    );
    const isApp = d.NecessárioInstalaçãoDeAplicaçãoWebServer;
    if (isApp) {
      return `MS-VM-WEB-0${instanceSize}`;
    }
    return `MS-VM-0${instanceSize}`;
  });
  return svcIds;
};

const getElbQuote = (elbData) => {
  const albCount = elbData.ConfiguraçãoApplicationLoadBalancer.length;
  const nlbCount = elbData.ConfiguaçãoNetworkLoadBalancer.length;
  const svcIds = [];
  for (let i = 0; i < albCount + nlbCount; i += 1) {
    svcIds.push('MS-LB-AW-01');
  }
  return svcIds;
};

const ec2Quote = getEc2Quote(data.body['_2LevantamentoTécnico'].WorkloadWebAmazonWebServices.EC2.ConfiguraçãoEC2);
const elbQuote = getElbQuote(data.body['_2LevantamentoTécnico'].WorkloadWebAmazonWebServices.ElasticLoadBalancer);

console.log(ec2Quote);
console.log(elbQuote);
