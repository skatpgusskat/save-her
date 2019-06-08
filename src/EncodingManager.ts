import AWS from 'aws-sdk';

export default class EncodingManager {
  private ec2 = new AWS.EC2({
    region: 'ap-northeast-2',
  });
  private readonly instanceType = 'c5d.2xlarge';
  private readonly maximumSpotPrice = '0.12';

  public requestSpotInstance(durationMinutes: 60 | 120 | 180 | 240 | 300) {
    const params = {
      InstanceCount: 1,
      BlockDurationMinutes: durationMinutes,
      LaunchSpecification: {
        IamInstanceProfile: {
          Arn: 'arn:aws:iam::123456789012:instance-profile/my-iam-role'
        },
        ImageId: 'ami-1a2b3c4d',
        InstanceType: this.instanceType,
        SecurityGroupIds: [
          'sg-1a2b3c4d'
        ]
      },
      SpotPrice: this.maximumSpotPrice,
      Type: 'one-time',

    };
    this.ec2.requestSpotInstances(params, function (err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else console.log(data);           // successful response
      /*
      data = {
      }
      */
    });
  }
}