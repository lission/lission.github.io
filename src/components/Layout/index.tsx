import PropTypes from 'prop-types';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import styles from './style.module.css';

type LayoutProps = React.PropsWithChildren<{
  /** 博客页面可覆盖标题；跑步首页保持原有默认标题不变。 */
  title?: string;
  description?: string;
}>;

const Layout = ({ children, title, description: descriptionOverride }: LayoutProps) => {
  const { siteTitle, shortTitle, description } = useSiteMetadata();

  return (
    <>
      <Helmet bodyAttributes={{ class: styles.body }}>
        <html lang="zh-CN" />
        <title>{title ? `${title} · ${shortTitle}` : siteTitle}</title>
        <meta name="description" content={descriptionOverride ?? description} />
        <meta name="keywords" content="跑步, 阅读, 随笔, 书单, 生活的另外部分, Lission" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Helmet>
      <Header />
      <div className="max-w-[1120px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {children}
      </div>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default Layout;
