interface ISiteMetadataResult {
  siteTitle: string;
  /** 胶囊导航里显示的短名，避免完整标题把导航挤窄。 */
  shortTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: '生活的另外部分 · Lission',
  shortTitle: '生活的另外部分',
  siteUrl: 'https://lission.github.io/',
  logo: '/images/logo.svg',
  description: '跑过些路、读了点书、写点日常',
  navLinks: [
    { name: '阅读', url: '/reading' },
    { name: '随笔', url: '/notes' },
    { name: '书单', url: '/books' },
    { name: '关于', url: '/about' },
  ],
};

export default data;
