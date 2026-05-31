export default function VideoCard({
  title,
  data,
}) {

  return (
    <div className="
      bg-zinc-900
      p-4
      rounded-xl
    ">

      <h2 className="
        text-xl
        font-bold
        mb-3
      ">
        {title}
      </h2>

      <p>
        Creator:
        {" "}
        {data.creator}
      </p>

      <p>
        Likes:
        {" "}
        {data.likes}
      </p>

      <p>
        Comments:
        {" "}
        {data.comments}
      </p>

      <p>
        Views:
        {" "}
        {data.views}
      </p>

      <p>
        Duration:
        {" "}
        {data.duration}
      </p>

      <p>
        Upload:
        {" "}
        {
          String(
            data.uploadDate
          )
        }
      </p>

    </div>
  );
}