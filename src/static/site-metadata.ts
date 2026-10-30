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
  logo: '/images/logo.svg',
  description: 'Personal site and blog',
  navLinks: [
    {
      name: 'Blog',
      url: 'https://github.com/lission/markDownNote?tab=readme-ov-file#readme',
    },
    {
      name: 'About',
      url: 'https://github.com/lission/lission.github.io',
    },
  ],
};

export default data;
