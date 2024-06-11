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
  logo: 'https://ibb.co/1zkHsDs',
  description: 'Personal site and blog',
  navLinks: [
    {
      name: 'Blog',
      url: 'https://lission.github.io/',
    },
    {
      name: 'About',
      url: 'https://github.com/lission/lission.github.io',
    },
  ],
};

export default data;
