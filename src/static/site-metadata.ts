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
  siteTitle: 'Lission Running Page',
  siteUrl: 'https://lission.github.io/',
  logo: 'https://raw.githubusercontent.com/lission/markdownPics/main/self/WechatIMG192.jpg',
  description: 'Personal site and blog',
  navLinks: [
    {
      name: 'Blog',
      url: 'https://lission.github.io/',
    },
    {
      name: 'About',
      url: 'https://lission.github.io/',
    },
  ],
};

export default data;
