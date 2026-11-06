import { useParams } from 'react-router-dom';
import PostPageView from '../components/PostPageView';

const NotePostPage = () => {
  const { slug = '', year = '' } = useParams();
  return (
    <PostPageView
      slug={slug}
      type="note"
      backTo={year ? `/notes/${year}` : '/notes'}
      backLabel="返回随笔列表"
    />
  );
};

export default NotePostPage;
