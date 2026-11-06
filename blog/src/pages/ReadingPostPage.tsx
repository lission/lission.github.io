import { useParams } from 'react-router-dom';
import PostPageView from '../components/PostPageView';

const ReadingPostPage = () => {
  const { slug = '' } = useParams();
  return <PostPageView slug={slug} type="reading" backTo="/reading" backLabel="返回阅读笔记" />;
};

export default ReadingPostPage;
