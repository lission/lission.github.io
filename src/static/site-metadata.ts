interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: 'Lission 跑步主页',
  siteUrl: 'https://lission.github.io/',
  logo: '/images/logo.svg',
  description: '个人跑步记录与博客',
  navLinks: [
    {
      name: '博客',
      url: 'https://github.com/lission/markDownNote?tab=readme-ov-file#readme',
    },
    {
      name: '关于',
      url: 'https://github.com/lission/lission.github.io',
    },
  ],
};

export default data;
