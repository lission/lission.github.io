import { formatPace, titleForRun, formatRunTime, Activity, RunIds } from '@/utils/utils';
import styles from './style.module.css';

interface IRunRowProperties {
  elementIndex: number;
  locateActivity: (_runIds: RunIds) => void;
  run: Activity;
  runIndex: number;
  setRunIndex: (_ndex: number) => void;
}

const getFeelingEmoji = (run: Activity): string => {
  const heartRate = run.average_heartrate;
  const pace = run.average_speed;
  
  if (heartRate) {
    if (heartRate < 140) return '😊';
    if (heartRate < 160) return '😄';
    if (heartRate < 175) return '😐';
    return '😤';
  }
  
  if (pace) {
    const paceMin = (1000 / 60) * (1 / pace);
    if (paceMin < 5.5) return '😄';
    if (paceMin < 6.5) return '😊';
    return '😐';
  }
  
  return '🏃';
};

const RunRow = ({ elementIndex, locateActivity, run, runIndex, setRunIndex }: IRunRowProperties) => {
  const distance = (run.distance / 1000.0).toFixed(2);
  const paceParts = run.average_speed ? formatPace(run.average_speed) : null;
  const heartRate = run.average_heartrate;
  const runTime = formatRunTime(run.moving_time);
  const handleClick = () => {
    if (runIndex === elementIndex) {
      setRunIndex(-1);
      locateActivity([]);
      return
    };
    setRunIndex(elementIndex);
    locateActivity([run.run_id]);
  };

  return (
    <tr
      className={`${styles.runRow} ${runIndex === elementIndex ? styles.selected : ''}`}
      key={run.start_date_local}
      onClick={handleClick}
    >
      <td className="font-medium text-ghibli-text">{titleForRun(run)}</td>
      <td className="font-bold text-ghibli-text">{distance}</td>
      {paceParts && <td className="italic text-ghibli-accent">{paceParts}</td>}
      <td>{heartRate && heartRate.toFixed(0)}</td>
      <td>{runTime}</td>
      <td className={styles.runDate}>{run.start_date_local}</td>
    </tr>
  );
};

export default RunRow;
