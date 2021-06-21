/* eslint-disable no-console */
const fs = require('fs');
const _ = require('lodash');

const raw = fs.readFileSync('sample.json');
const data = JSON.parse(raw);

const rawIntances = fs.readFileSync('new_instance_sizes.json');
const instancesData = JSON.parse(rawIntances);

const technicalRequirements = data.body['_2LevantamentoTécnico'].WorkloadWebAmazonWebServices;

// const services = technicalRequirements.ServiçosASeremUtilizados;

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

const getAlbQuote = (elbData) => elbData.map(() => 'MS-LB-AW-01');

const getNlbQuote = (elbData) => elbData.map(() => 'MS-LB-AW-01');

const getElastiCacheQuote = (elastiCacheData) => {
  const ecRedisCount = elastiCacheData.ConfiguraçãoElastiCacheForRedis.length;
  const ecMcCount = elastiCacheData.ConfiguraçãoElastiCacheForMemCached.length;
  const svcIds = [];
  for (let i = 0; i < ecRedisCount + ecMcCount; i += 1) {
    svcIds.push('MS-DB-EC-01');
  }
  return svcIds;
};

const getDynamoDBQuote = (dynamoDBData) => dynamoDBData.map(() => 'MS-DB-DY-01');

const getS3Quote = (s3Data) => s3Data.ConfiguraçãoBucket2.map(() => 'MS-AW-S3-01');

const getLambdaQuote = (lambdaData) => lambdaData.ConfiguraçãoDaFunção.map(() => 'MS-SL-01');

const getAPIGatewayQuote = (apiGwData) => {
  const svcIds = apiGwData.ConfiguraçãoAPIGateway.map((apigw) => {
    let size = 1;
    if (apigw.NúmeroDeEndpoints >= 10) {
      size = 2;
    }
    if (apigw.NúmeroDeEndpoints >= 50) {
      size = 3;
    }
    return `MS-APIGW-0${size}`;
  });
  return svcIds;
};

const getCloudFrontQuote = (cfData) => cfData.map(() => 'MS-AW-CF-01');

const getSnsQuote = (snsData) => snsData.ConfiguraçãoDoTópico.map(() => 'MS-SQS-01');

const getSqsQuote = (sqsData) => sqsData.ConfiguraçãoDaFila.map(() => 'MS-SQS-01');

const servicesMap = {
  EC2: {
    path: technicalRequirements.EC2.ConfiguraçãoEC2,
    quoteFunc: getEc2Quote,
  },
  ElastiCache: {
    path: technicalRequirements.Elasticache,
    quoteFunc: getElastiCacheQuote,
  },
  DynamoDB: {
    path: technicalRequirements.BancoDeDadosNoSQL.DynamoDB.ConfiguraçãoDynamoDB,
    quoteFunc: getDynamoDBQuote,
  },
  S3: {
    path: technicalRequirements.S3,
    quoteFunc: getS3Quote,
  },
  // ECS: technicalRequirements.ECS,
  'API Gateway': {
    path: technicalRequirements.APIGateway,
    quoteFunc: getAPIGatewayQuote,
  },
  SNS: {
    path: technicalRequirements.SNS,
    quoteFunc: getSnsQuote,
  },
  SQS: {
    path: technicalRequirements.SQS,
    quoteFunc: getSqsQuote,
  },
  // RDS: technicalRequirements.RDS,
  // EKS: technicalRequirements.ElasticKubernetesServiceEKS,
  // 'Auto Scaling': technicalRequirements.AutoScaling2,
  Lambda: {
    path: technicalRequirements.Lambda,
    quoteFunc: getLambdaQuote,
  },
  // Deployment: technicalRequirements.Deployment,
  'Application Load Balancer': {
    path: technicalRequirements.ElasticLoadBalancer.ConfiguraçãoApplicationLoadBalancer,
    quoteFunc: getAlbQuote,
  },
  'Network Load Balancer': {
    path: technicalRequirements.ElasticLoadBalancer.ConfiguraçãoNetworkLoadBalancer,
    quoteFunc: getNlbQuote,
  },
  // 'URLs/Route53': technicalRequirements.URLsRoute53,
  CloudFront: {
    path: technicalRequirements.CloudFront.Origens,
    quoteFunc: getCloudFrontQuote,
  },
};

const services = [
  'EC2',
  'DynamoDB',
  'S3',
  // 'ECS',
  'API Gateway',
  'SNS',
  // 'SQS',
  // 'RDS',
  // 'EKS',
  // 'Auto Scaling',
  'Lambda',
  // 'Deployment',
  // 'Application Load Balancer',
  // 'URLs/Route53',
  'CloudFront',
];

const getQuote = services.map(
  (service) => servicesMap[service].quoteFunc(servicesMap[service].path),
);
console.log(_.flatten(getQuote));
